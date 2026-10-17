vi.mock("@/lib/schools/package", () => ({ readSchoolPackage: vi.fn(async () => ({ paid: false, used: 0, limit: 30 })), schoolUploadLease: vi.fn(async () => true) }));
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const parse = vi.hoisted(() => vi.fn());
vi.mock("@/lib/document-parsing", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/document-parsing")>(), parseDocument: parse,
}));
vi.mock("@/lib/ats-checker", () => ({ runAtsChecker: vi.fn(async () => undefined) }));
const groupAccess = vi.hoisted(() => vi.fn());
vi.mock("@/lib/schools/server", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/schools/server")>(), requireSchoolGroup: groupAccess,
}));
import { POST } from "@/app/api/analyses/route";
import { getAnalysisById } from "@/lib/data/store";
import { SchoolError } from "@/lib/schools/server";
afterEach(() => { delete process.env.DOCUMENT_QA_MODE; });
beforeEach(() => { process.env.MOCK_MODE = "true"; vi.clearAllMocks(); });
function upload(consent = true) {
  const form = new FormData();
  form.set("file", new File(["%PDF synthetic test"], "fictional.pdf", { type: "application/pdf" }));
  form.set("schoolGroupId", "11111111-1111-4111-8111-111111111111"); form.set("schoolStudentName", "Fikcyjna osoba");
  form.set("schoolConsent", String(consent)); form.set("role", "backend_developer"); form.set("seniority", "senior");
  return new Request("http://localhost/api/analyses", { method: "POST", headers: { origin: "http://localhost" }, body: form });
}
describe("school upload boundary", () => {
  it("persists extracted contacts with the school report but excludes them from the teaser", async () => {
    process.env.DOCUMENT_QA_MODE = "true";
    groupAccess.mockResolvedValue({ member: { schoolId: "school-a" }, group: { target_role: "frontend_developer", target_seniority: "first_job" } });
    parse.mockResolvedValue({ text: "Anna Testowa\nEmail: anna@example.com\nTel: +48 501 234 567\nDoświadczenie\nFrontend Developer React TypeScript\nProjekty\nAplikacja React, testy, API, Git.\nWykształcenie\nSzkoła IT\nUmiejętności\nJavaScript HTML CSS", segments: [], diagnostics: { document_kind: "pdf" } });
    const response = await POST(upload());
    expect(response.status).toBe(200);
    const payload = await response.json();
    const analysis = await getAnalysisById(payload.analysisId);
    expect(analysis?.report).toHaveProperty("schoolContact", { emails: ["anna@example.com"], phones: [{ label: "+48 501 234 567", number: "+48501234567" }] });
    expect(JSON.stringify(payload)).not.toContain("anna@example.com");
  });
  it("rejects school uploads without authenticated group ownership", async () => {
    groupAccess.mockRejectedValue(new SchoolError(401, "Zaloguj się."));
    expect((await POST(upload())).status).toBe(401);
  });
  it("requires processing confirmation before generating a report", async () => {
    groupAccess.mockResolvedValue({ member: { schoolId: "school-a" }, group: { target_role: "frontend_developer", target_seniority: "first_job" } });
    expect((await POST(upload(false))).status).toBe(400);
  });
  it("binds the report to the verified group and overrides forged rubric fields", async () => {
    groupAccess.mockResolvedValue({ member: { schoolId: "school-a" }, group: { target_role: "frontend_developer", target_seniority: "first_job" } });
    const response = await POST(upload());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).not.toHaveProperty("accessToken");
    const analysis = await getAnalysisById(payload.analysisId);
    expect(analysis).toMatchObject({ schoolGroupId: "11111111-1111-4111-8111-111111111111", schoolStudentName: "Fikcyjna osoba", paid: false });
    expect(analysis?.report.document.targetSeniority).toBe("first_job");
    expect(analysis?.report.document.targetRole).toContain("Frontend");
  });
});
