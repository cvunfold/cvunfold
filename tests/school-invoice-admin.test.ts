import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), change: vi.fn() }));
vi.mock("@/lib/schools/invoice-access", async original => ({ ...await original<object>(), readInvoiceAccess: mocks.read, changeInvoiceAccess: mocks.change }));
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit: () => true }));
import { GET, POST } from "@/app/api/admin/schools/access/route";
const schoolId = "11111111-1111-4111-8111-111111111111", requestId = "22222222-2222-4222-8222-222222222222";
const secret = "a".repeat(43), ref = "q".repeat(20);
const payload = { action: "activate", schoolId, requestId, invoiceReference: "FV/2026/1", expiresAt: "2027-01-01T00:00:00Z" };
const headers = { authorization: `Bearer ${secret}`, "content-type": "application/json", "x-cvunfold-environment": "development", "x-cvunfold-database-ref": ref };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("ADMIN_SECRET", secret); vi.stubEnv("SUPABASE_URL", `https://${ref}.supabase.co`); vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL_ENV", ""); vi.stubEnv("VERCEL_TARGET_ENV", ""); mocks.change.mockResolvedValue({ replayed: false, active: true }); mocks.read.mockResolvedValue({ school: { id: schoolId, name: "Szkoła testowa" }, access: null, active: false }); });
afterEach(() => vi.unstubAllEnvs());
it("rejects a teacher cookie without owner authorization before database access", async () => {
  const response = await POST(new Request("http://localhost/api/admin/schools/access", { method: "POST", headers: { cookie: "cvunfold_school_session=teacher" }, body: JSON.stringify(payload) }));
  expect(response.status).toBe(401); expect(mocks.change).not.toHaveBeenCalled();
});
it("requires confirmation of the exact server environment and database before writing", async () => {
  const response = await POST(new Request("http://localhost/api/admin/schools/access", { method: "POST", headers: { ...headers, "x-cvunfold-database-ref": "other" }, body: JSON.stringify(payload) }));
  expect(response.status).toBe(409); expect(mocks.change).not.toHaveBeenCalled();
});
it("rejects an unrelated browser origin even with the owner credential", async () => {
  expect((await POST(new Request("http://localhost/api/admin/schools/access", { method: "POST", headers: { ...headers, origin: "https://other.example" }, body: JSON.stringify(payload) }))).status).toBe(403);
  expect(mocks.change).not.toHaveBeenCalled();
});
it("passes only verified invoice fields to the atomic activation function", async () => {
  const response = await POST(new Request("http://localhost/api/admin/schools/access", { method: "POST", headers, body: JSON.stringify(payload) }));
  expect(response.status).toBe(200); expect(mocks.change).toHaveBeenCalledExactlyOnceWith(payload);
});
it("rejects malformed or additional entitlement fields", async () => {
  for (const body of [{ ...payload, invoiceReference: "" }, { ...payload, schoolId: "foreign" }, { ...payload, paid: true }]) {
    expect((await POST(new Request("http://localhost/api/admin/schools/access", { method: "POST", headers, body: JSON.stringify(body) }))).status).toBe(400);
  }
  expect(mocks.change).not.toHaveBeenCalled();
});
it("keeps owner-only access metadata private and out of cache", async () => {
  const response = await GET(new Request(`http://localhost/api/admin/schools/access?schoolId=${schoolId}`, { headers }));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.json()).toMatchObject({ environment: "development", databaseRef: ref, active: false });
});
