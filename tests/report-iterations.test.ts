import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as revise } from "@/app/api/report/revisions/route";
import { GET as readReport, DELETE as removeReport } from "@/app/api/report/route";
import { POST as accessLink } from "@/app/api/report/access-link/route";
import { POST as openSession } from "@/app/api/report-session/route";
import { saveAnalysis, markAnalysisPaid, reserveReportRevision, finishReportRevision, getAnalysis, getReportRevisions } from "@/lib/data/store";
import { createMockReport } from "@/lib/ai/mock-report";
import { createAccessToken } from "@/lib/security/tokens";
import { REPORT_SESSION_COOKIE } from "@/lib/security/report-session";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
import { verifyTurnstile } from "@/lib/security/turnstile";

vi.mock("@/lib/ai/openai-review", async importOriginal => ({ ...await importOriginal<object>(), reviewWithOpenAI: vi.fn() }));
vi.mock("@/lib/ats-checker", () => ({ runAtsChecker: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/document-parsing", () => ({ parseDocument: vi.fn().mockResolvedValue({ text: "Frontend Developer React project experience education skills ".repeat(15), segments: [{ id: "s1", text: "fictional project" }] }) }));
vi.mock("@/lib/security/turnstile", () => ({ verifyTurnstile: vi.fn() }));
let token: string, id: string;
const headers = () => ({ cookie: `${REPORT_SESSION_COOKIE}=${token}`, origin: "https://cvunfold.com" });
function request(requestId = randomUUID(), changes: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", new File(["%PDF-1.7 fixture"], "fixture.pdf", { type: "application/pdf" }));
  form.set("analysisId", id); form.set("requestId", requestId);
  for (const [key,value] of Object.entries(changes)) form.set(key,value);
  return new Request("https://cvunfold.com/api/report/revisions", { method: "POST", headers: headers(), body: form });
}
async function fixture(locale: "pl" | "en" = "pl", paid = true) {
  token = createAccessToken(); id = randomUUID();
  await saveAnalysis(token, { id, createdAt: new Date(), expiresAt: new Date(Date.now()+86400_000), status: "complete", paid, plan: "full_review", locale, market: locale, attribution: {}, feedback: [], report: createMockReport("first_job", false, "frontend_developer", locale, "first_job") });
}
beforeEach(async () => { vi.clearAllMocks(); vi.stubEnv("MOCK_MODE", "true"); await fixture(); });
afterEach(() => { vi.unstubAllEnvs(); });
describe("paid CV iteration workspace", () => {
  it("does not disclose full versions or start a model call before payment", async () => {
    await fixture("pl",false);
    expect((await revise(request())).status).toBe(403);
    const response = await readReport(new Request(`https://cvunfold.com/api/report?id=${id}`, { headers: headers() }));
    const result = await response.json();
    expect(result.revisions).toEqual([]); expect(result.rechecksRemaining).toBe(0);
    expect(result.report).not.toHaveProperty("strengths"); expect(reviewWithOpenAI).not.toHaveBeenCalled();
  });
  it.each(["pl","en"] as const)("keeps the original criteria and history in %s", async locale => {
    await fixture(locale);
    const first = randomUUID();
    const response = await revise(request(first, { seniority: "senior", role: "backend_developer", jobDescription: "ignored client override" }));
    expect(response.status).toBe(200);
    expect((await revise(request(first))).status).toBe(200);
    let result = await (await readReport(new Request(`https://cvunfold.com/api/report?id=${id}`, { headers: headers() }))).json();
    expect(result.revisions).toHaveLength(2); expect(result.version).toBe(1); expect(result.rechecksRemaining).toBe(1);
    expect(result.report.document.targetSeniority).toBe("first_job"); expect(result.report.document.targetRole).toBe("Frontend Developer"); expect(result.report.locale).toBe(locale);
    expect((await revise(request())).status).toBe(200);
    expect((await revise(request())).status).toBe(409);
    result = await (await readReport(new Request(`https://cvunfold.com/api/report?id=${id}&version=0`, { headers: headers() }))).json();
    expect(result.version).toBe(0); expect(result.revisions).toHaveLength(3); expect(result.rechecksRemaining).toBe(0);
  });
  it("blocks simultaneous attempts and releases the slot after a failed model call", async () => {
    vi.stubEnv("MOCK_MODE", "false");
    vi.mocked(reviewWithOpenAI).mockRejectedValue(new Error("private model error"));
    const failed = await revise(request());
    expect(failed.status).toBe(503); expect(JSON.stringify(await failed.json())).not.toContain("private model error");
    expect(await getReportRevisions((await getAnalysis(token))!)).toHaveLength(0);
    await reserveReportRevision(token,randomUUID(),randomUUID());
    await expect(reserveReportRevision(token,randomUUID(),randomUUID())).rejects.toThrow("REVISION_BUSY");
  });
  it("rejects another report ID even with a valid private session", async () => {
    expect((await revise(request(randomUUID(),{ analysisId: randomUUID() }))).status).toBe(404);
    expect((await readReport(new Request(`https://cvunfold.com/api/report?id=${randomUUID()}`, { headers: headers() }))).status).toBe(404);
    expect((await openSession(new Request("https://cvunfold.com/api/report-session", { method:"POST", headers:{"Content-Type":"application/json"},body:JSON.stringify({token,analysisId:randomUUID()}) }))).status).toBe(404);
  });
  it("copies a stable link and permits reopening it without the old cookie", async () => {
    const first = await (await accessLink(new Request("https://cvunfold.com/api/report/access-link", { method:"POST",headers:headers() }))).json();
    const second = await (await accessLink(new Request("https://cvunfold.com/api/report/access-link", { method:"POST",headers:headers() }))).json();
    expect(first.url).toBe(second.url); expect(new URL(first.url).pathname).toBe(`/raport/${id}`);
    const reopened = await openSession(new Request("https://cvunfold.com/api/report-session",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:new URL(first.url).hash.slice(1),analysisId:id}) }));
    expect(reopened.status).toBe(200); expect(reopened.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("binds destructive actions and copied links to the visible report", async () => {
    const wrong = { ...headers(), "X-Report-ID": randomUUID() };
    expect((await removeReport(new Request("https://cvunfold.com/api/report", {method:"DELETE",headers:wrong}))).status).toBe(404);
    expect((await accessLink(new Request("https://cvunfold.com/api/report/access-link", {method:"POST",headers:wrong}))).status).toBe(404);
    expect(await getAnalysis(token)).toBeTruthy();
  });
  it("runs a fresh review with the server's original target and no job matching", async () => {
    vi.stubEnv("MOCK_MODE", "false");
    vi.mocked(reviewWithOpenAI).mockResolvedValue({ report: createMockReport("first_job",false,"frontend_developer","pl","first_job"), telemetry: { model:"test",inputTokens:0,outputTokens:0,estimatedCost:0,provenance:null } } as unknown as Awaited<ReturnType<typeof reviewWithOpenAI>>);
    expect((await revise(request(randomUUID(), {seniority:"lead",role:"backend_developer"}))).status).toBe(200);
    expect(reviewWithOpenAI).toHaveBeenCalledWith(expect.objectContaining({ targetRole:"frontend_developer",targetSeniority:"first_job",careerContext:"first_job",locale:"pl" }));
    expect(vi.mocked(reviewWithOpenAI).mock.calls[0][0]).not.toHaveProperty("jobDescription");
  });
  it("requires a successful fresh bot verification", async () => {
    vi.mocked(verifyTurnstile).mockRejectedValueOnce(new Error("TURNSTILE_FAILED"));
    expect((await revise(request())).status).toBe(503);
    expect(await getReportRevisions((await getAnalysis(token))!)).toHaveLength(0);
  });
  it("removes every version with the original report", async () => {
    await revise(request());
    const item = (await getAnalysis(token))!;
    expect(await getReportRevisions(item)).toHaveLength(1);
    expect((await removeReport(new Request("https://cvunfold.com/api/report",{method:"DELETE",headers:headers()}))).status).toBe(204);
    expect(await getReportRevisions(item)).toHaveLength(0);
    expect((await readReport(new Request("https://cvunfold.com/api/report",{headers:headers()}))).status).toBe(404);
  });
  it("rejects expiration and stale completion without charging a new version", async () => {
    const leaseId=randomUUID(); await reserveReportRevision(token,randomUUID(),leaseId);
    expect(await finishReportRevision(token,randomUUID(),createMockReport(),null)).toBe(false);
    await fixture("pl",false); await markAnalysisPaid(token);
    await saveAnalysis(token,{...(await getAnalysis(token))!,expiresAt:new Date(Date.now()-1)});
    expect((await revise(request())).status).toBe(404);
  });
});
