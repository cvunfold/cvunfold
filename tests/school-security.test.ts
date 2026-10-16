vi.mock("@/lib/schools/package", () => ({ readSchoolPackage: vi.fn(async () => ({ paid: false, used: 0, limit: 30 })) }));
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const fake = vi.hoisted(() => ({ database: vi.fn(), client: vi.fn(), getAnalysis: vi.fn(), fulfill: vi.fn(), checkout: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: fake.client }));
vi.mock("@/lib/data/store", () => ({ getAnalysisById: fake.getAnalysis }));
vi.mock("@/lib/payments/stripe", () => ({ fulfillCheckoutSession: fake.fulfill, createCheckout: fake.checkout }));
import { requireSameOrigin, requireSchool, setSchoolCookie, SCHOOL_COOKIE } from "@/lib/schools/server";
import { GET, POST, DELETE } from "@/app/api/schools/reports/[id]/route";
import { hashToken } from "@/lib/security/tokens";
import { createMockReport } from "@/lib/ai/mock-report";
import { readSchoolData } from "@/lib/schools/data";

function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "gt", "order", "range", "in", "not", "insert", "delete"]) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}
const id = "11111111-1111-4111-8111-111111111111";
const token = "a".repeat(43);
const headers = { cookie: `${SCHOOL_COOKIE}=${token}`, origin: "http://localhost" };
const context = { params: Promise.resolve({ id }) };
beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-not-a-key";
  fake.client.mockReturnValue({ from: fake.database });
});
afterEach(() => vi.unstubAllEnvs());

function localTestGrant() {
  vi.stubEnv("SCHOOL_TEST_ACCESS_ENABLED", "true"); vi.stubEnv("VERCEL_ENV", ""); vi.stubEnv("VERCEL_TARGET_ENV", "");
  vi.stubEnv("SCHOOL_TEST_ACCESS_USER_ID", "user-a"); vi.stubEnv("SCHOOL_TEST_ACCESS_SCHOOL_ID", "school-a");
  vi.stubEnv("SCHOOL_TEST_ACCESS_GROUP_ID", "group-a");
  vi.stubEnv("SCHOOL_TEST_ACCESS_EXPIRES_AT", new Date(Date.now() + 3_600_000).toISOString());
}

function permit(analysisGroup = "group-a", groupOwned = true, userId = "user-a") {
  fake.database.mockImplementation((table: string) => {
    if (table === "school_sessions") return query({ data: { user_id: userId }, error: null });
    if (table === "school_members") return query({ data: { school_id: "school-a", schools: { name: "School A" } }, error: null });
    if (table === "analyses") return query({ data: { school_group_id: analysisGroup }, error: null });
    if (table === "school_groups") return query({ data: groupOwned ? { id: "group-a", name: "A" } : null, error: null });
    throw new Error(table);
  });
}

describe("school access boundaries", () => {
  it("requires a server session even in MOCK_MODE", async () => {
    process.env.MOCK_MODE = "true";
    await expect(requireSchool(new Request("http://localhost"))).rejects.toMatchObject({ status: 401 });
    expect(fake.client).not.toHaveBeenCalled();
  });
  it("rejects revoked/expired sessions", async () => {
    fake.database.mockReturnValue(query({ data: null, error: null }));
    await expect(requireSchool(new Request("http://localhost", { headers }))).rejects.toMatchObject({ status: 401 });
  });
  it("checks session hashes and active expiration rather than trusting a cookie user id", async () => {
    const sessionQuery = query({ data: { user_id: "user-a" }, error: null });
    permit(); fake.database.mockImplementationOnce(() => sessionQuery);
    await requireSchool(new Request("http://localhost", { headers }));
    expect(sessionQuery.eq).toHaveBeenCalledWith("token_hash", hashToken(token));
    expect(sessionQuery.gt).toHaveBeenCalledWith("expires_at", expect.any(String));
  });
  it("rejects cross-origin mutations and cookies are HttpOnly", () => {
    expect(() => requireSameOrigin(new Request("http://localhost", { headers: { origin: "https://other.example" } }))).toThrow();
    const response = NextResponse.json({}); setSchoolCookie(response, SCHOOL_COOKIE, token, 3600);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });
  it("uses the incoming Host for a Next request reconstructed with localhost", () => {
    expect(() => requireSameOrigin(new Request("http://localhost:3108/api/schools/auth", { headers: {
      host: "127.0.0.1:3108", origin: "http://127.0.0.1:3108", "x-forwarded-proto": "http",
    } }))).not.toThrow();
    expect(() => requireSameOrigin(new Request("http://localhost:3108/api/schools/auth", { headers: {
      host: "127.0.0.1:3108", origin: "https://other.example", "x-forwarded-host": "other.example",
    } }))).toThrow();
  });
  it.each([GET, POST, DELETE])("does not read, buy or delete a report belonging to another school", async handler => {
    permit("group-b", false);
    const response = await handler(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context);
    expect(response.status).toBe(404);
    expect(fake.getAnalysis).not.toHaveBeenCalled(); expect(fake.checkout).not.toHaveBeenCalled();
  });
  it("returns only the teaser for an unpaid report and ignores a success URL flag", async () => {
    permit(); fake.getAnalysis.mockResolvedValue({ id, paid: false, report: createMockReport(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const response = await GET(new Request(`http://localhost/api/schools/reports/${id}?checkout=success`, { headers }), context);
    const payload = await response.json();
    expect(payload.paid).toBe(false); expect(payload.report).not.toHaveProperty("issues");
    expect(payload.report).not.toHaveProperty("evidenceMap"); expect(fake.fulfill).not.toHaveBeenCalled();
    expect(payload).not.toHaveProperty("answerScope");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("returns a full report only after the stored paid check", async () => {
    permit(); fake.getAnalysis.mockResolvedValue({ id, paid: true, report: createMockReport(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const response = await GET(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context);
    const payload = await response.json();
    expect(payload.report.issues.length).toBeGreaterThan(0);
    expect(payload.answerScope).toMatch(/^[a-f0-9]{64}$/);
  });
  it("separates answer storage for two authorized accounts in the same school", async () => {
    fake.getAnalysis.mockResolvedValue({ id, paid: true, report: createMockReport(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    permit();
    const first = await (await GET(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context)).json();
    permit("group-a", true, "user-b");
    const second = await (await GET(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context)).json();
    expect(first.answerScope).not.toBe(second.answerScope);
  });
  it("returns an unpaid full report under the approved local grant without creating a payment", async () => {
    localTestGrant(); permit();
    fake.getAnalysis.mockResolvedValue({ id, paid: false, report: createMockReport(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const response = await GET(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context);
    const payload = await response.json();
    expect(payload).toMatchObject({ paid: false, fullAccess: true, testAccess: true });
    expect(payload.report.issues.length).toBeGreaterThan(0);
    const checkout = await POST(new Request(`http://localhost/api/schools/reports/${id}`, { method: "POST", headers }), context);
    expect(checkout.status).toBe(410); expect(await checkout.json()).toMatchObject({ error: "SCHOOL_CHECKOUT_DISABLED" });
    expect(fake.checkout).not.toHaveBeenCalled(); expect(fake.fulfill).not.toHaveBeenCalled();
  });
  it("keeps the unpaid filter in production even with local test settings present", async () => {
    localTestGrant(); vi.stubEnv("NODE_ENV", "production"); permit();
    fake.getAnalysis.mockResolvedValue({ id, paid: false, report: createMockReport(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const response = await GET(new Request(`http://localhost/api/schools/reports/${id}`, { headers }), context);
    const payload = await response.json();
    expect(payload).toMatchObject({ paid: false, fullAccess: false, testAccess: false });
    expect(payload.report).not.toHaveProperty("issues");
  });
  it("the group payload excludes full unpaid reports and restricts group reads to the school", async () => {
    const groupQuery = query({ data: [{ id: "group-a", name: "A", target_role: "frontend_developer", target_seniority: "first_job" }], error: null });
    permit(); fake.database.mockImplementation((table: string) => {
      if (table === "school_sessions") return query({ data: { user_id: "user-a" }, error: null });
      if (table === "school_members") return query({ data: { school_id: "school-a", schools: { name: "A" } }, error: null });
      if (table === "school_groups") return groupQuery;
      if (table === "analyses") return query({ data: [{ id, school_student_name: "A", created_at: "2026-10-10", expires_at: "2099-01-01", paid_at: null, contact_details: [{ contact: { emails: ["student@example.com"], phones: [] } }] }], error: null });
      throw new Error(table);
    });
    const result = await readSchoolData(new Request("http://localhost", { headers }));
    expect(result.students[0]).toMatchObject({ paid: false, report: null, contact: { emails: ["student@example.com"], phones: [] } });
    expect(groupQuery.eq).toHaveBeenCalledWith("school_id", "school-a");
    await expect(readSchoolData(new Request("http://localhost", { headers }), "group-b")).rejects.toMatchObject({ status: 404 });
  });
});
