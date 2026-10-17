vi.mock("@/lib/feedback-mail", () => ({ sendFeedbackNotification: vi.fn(async () => true) }));
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as redeem } from "@/app/api/report/access-code/route";
import { POST as upload } from "@/app/api/analyses/route";
import { GET as read } from "@/app/api/report/route";
import { POST as checkout } from "@/app/api/report/checkout/route";
import { POST as walletCheckout } from "@/app/api/report/checkout/google-pay/route";
import { POST as feedback } from "@/app/api/report/feedback/route";
import { getAnalysis, getReportRevisions, saveAnalysis, reserveReportRevision, finishReportRevision } from "@/lib/data/store";
import { createMockReport } from "@/lib/ai/mock-report";
import { createAccessToken, hashToken } from "@/lib/security/tokens";
import { REPORT_SESSION_COOKIE } from "@/lib/security/report-session";
import { ACCESS_CODE_COOKIE, createPendingCodeGrant, hasReportCodeAccess, pendingCodeFromRequest, reportAccessCodesEnabled, validateReportAccessCode } from "@/lib/security/report-access-code";

beforeEach(() => {
  vi.stubEnv("MOCK_MODE", "true"); vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("REPORT_ACCESS_CODES_ENABLED", "true"); vi.stubEnv("REPORT_ACCESS_CODES", "komuna"); vi.stubEnv("REPORT_ACCESS_CODE_SECRET", "a-private-signing-secret-for-local-tests-only");
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
const call = (body: unknown, cookie = "", origin = "https://cvunfold.com") => new Request("https://cvunfold.com/api/report/access-code", { method: "POST", headers: { origin, cookie, "Content-Type": "application/json", "x-forwarded-for": randomUUID() }, body: JSON.stringify(body) });
async function fixture(schoolGroupId?: string) {
  const token = createAccessToken(), id = randomUUID();
  await saveAnalysis(token, { id, createdAt: new Date(), expiresAt: new Date(Date.now() + 86400_000), status: "complete", paid: false, plan: "full_review", locale: "pl", market: "pl", attribution: {}, feedback: [], report: createMockReport(), ...(schoolGroupId ? { schoolGroupId } : {}) });
  return { token, id, cookie: `${REPORT_SESSION_COOKIE}=${token}` };
}

describe("production access-code entitlements", () => {
  it("fails closed without private configuration and treats code as a shortcut only", () => {
    expect(reportAccessCodesEnabled()).toBe(true);
    expect(validateReportAccessCode("code")).toBeNull();
    expect(validateReportAccessCode(" KOMUNA ")).toBe(hashToken("komuna"));
    vi.stubEnv("REPORT_ACCESS_CODE_SECRET", "<redacted>");
    expect(reportAccessCodesEnabled()).toBe(false); expect(validateReportAccessCode("komuna")).toBeNull();
  });
  it("rejects disabled, incorrect, cross-origin and missing-origin requests", async () => {
    expect((await redeem(call({ code: "wrong" }))).status).toBe(403);
    expect((await redeem(call({ code: "komuna" }, "", "https://other.example"))).status).toBe(403);
    const missingOrigin = call({ code: "komuna" }); missingOrigin.headers.delete("origin");
    expect((await redeem(missingOrigin)).status).toBe(403);
    vi.stubEnv("REPORT_ACCESS_CODES_ENABLED", "false"); expect((await redeem(call({ code: "komuna" }))).status).toBe(404);
  });
  it("requires the matching private report session and never grants a school report", async () => {
    const f = await fixture();
    expect((await redeem(call({ code: "komuna", analysisId: f.id }))).status).toBe(401);
    expect((await redeem(call({ code: "komuna", analysisId: randomUUID() }, f.cookie))).status).toBe(404);
    const school = await fixture(randomUUID()); expect((await redeem(call({ code: "komuna", analysisId: school.id }, school.cookie))).status).toBe(404);
    expect((await getAnalysis(f.token))!.paid).toBe(false);
  });
  it("unlocks the full report and two rechecks durably without inventing a purchase", async () => {
    const f = await fixture();
    const readRequest = () => new Request(`https://cvunfold.com/api/report?id=${f.id}`, { headers: { cookie: f.cookie } });
    expect((await (await read(readRequest())).json()).fullAccess).toBe(false);
    expect((await redeem(call({ code: "komuna", analysisId: f.id }, f.cookie))).status).toBe(200);
    vi.stubEnv("REPORT_ACCESS_CODES_ENABLED", "false");
    const result = await (await read(readRequest())).json();
    expect(result).toMatchObject({ paid: false, fullAccess: true, accessMode: "access_code", rechecksRemaining: 2 });
    expect(result.report).toHaveProperty("strengths"); expect(result.purchase).toBeUndefined();
    expect(await (await checkout(new Request("https://cvunfold.com/api/report/checkout", { method: "POST", headers: { cookie: f.cookie } }))).json()).toEqual({ unlocked: true, accessMode: "access_code" });
    expect((await walletCheckout(new Request("https://cvunfold.com/api/report/checkout/google-pay", { method: "POST", headers: { cookie: f.cookie } }))).status).toBe(409);
    expect((await feedback(new Request("https://cvunfold.com/api/report/feedback", { method: "POST", headers: { origin: "https://cvunfold.com", cookie: f.cookie, "Content-Type": "application/json" }, body: JSON.stringify({ rating: 5, accurate: "yes" }) }))).status).toBe(200);
    for (let n = 0; n < 2; n++) { const lease = randomUUID(); await reserveReportRevision(f.token, randomUUID(), lease); expect(await finishReportRevision(f.token, lease, createMockReport(), null)).toBe(true); }
    await expect(reserveReportRevision(f.token, randomUUID(), randomUUID())).rejects.toThrow("REVISION_LIMIT");
    expect(await getReportRevisions((await getAnalysis(f.token))!)).toHaveLength(2);
    vi.stubEnv("REPORT_ACCESS_CODES_ENABLED", "true");
    expect((await redeem(call({ code: "komuna", analysisId: f.id }, f.cookie))).status).toBe(200);
    expect((await (await read(readRequest())).json()).rechecksRemaining).toBe(0);
  });
  it("accepts a code before upload using a signed HttpOnly cookie, not a client flag", async () => {
    const response = await redeem(call({ code: "komuna" }));
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie")!; expect(setCookie).toContain("HttpOnly"); expect(setCookie).not.toContain("komuna");
    const cookie = setCookie.split(";")[0];
    const form = new FormData(); form.set("file", new File(["%PDF-1.7 fictional"], "fictional.pdf", { type: "application/pdf" })); form.set("role", "frontend_developer"); form.set("seniority", "first_job");
    const result = await upload(new Request("https://cvunfold.com/api/analyses", { method: "POST", headers: { origin: "https://cvunfold.com", cookie, "x-forwarded-for": randomUUID() }, body: form }));
    expect(result.status).toBe(200); const data = await result.json();
    const item = (await getAnalysis(data.accessToken))!;
    expect(hasReportCodeAccess(item)).toBe(true); expect(item.paid).toBe(false); expect(item.purchase).toBeUndefined();
  });
  it("rejects tampered, expired and withdrawn pending code grants", () => {
    const hash = hashToken("komuna"), grant = createPendingCodeGrant(hash);
    const request = (value: string) => call({}, `${ACCESS_CODE_COOKIE}=${value}`);
    expect(pendingCodeFromRequest(request(grant))).toBe(hash);
    expect(pendingCodeFromRequest(request(grant.replace(hash, hashToken("other"))))).toBeNull();
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 3600_001); expect(pendingCodeFromRequest(request(grant))).toBeNull();
    vi.useRealTimers(); vi.stubEnv("REPORT_ACCESS_CODES", "different-code"); expect(pendingCodeFromRequest(request(grant))).toBeNull();
  });
  it("sets a Secure, HttpOnly, host-only pending cookie in the production runtime", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await redeem(call({ code: "komuna" }));
    const cookie = response.headers.get("set-cookie")!;
    expect(response.status).toBe(200); expect(cookie).toContain("Secure"); expect(cookie).toContain("HttpOnly"); expect(cookie).not.toContain("Domain=");
  });
  it("preserves a voucher for a new analysis when old criteria cannot support two rechecks", async () => {
    const f = await fixture(); const item = (await getAnalysis(f.token))!; item.report.rubricVersion = "legacy";
    const response = await redeem(call({ code: "komuna", analysisId: f.id }, f.cookie));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ accepted: true, newAnalysisRequired: true });
    expect(response.headers.get("set-cookie")).toContain(ACCESS_CODE_COOKIE);
    expect(hasReportCodeAccess(item)).toBe(false);
  });
});
