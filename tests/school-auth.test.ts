import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ db: vi.fn(), signin: vi.fn(), exchange: vi.fn(), user: vi.fn(), auth: vi.fn(), member: vi.fn(), issue: vi.fn(), quota: vi.fn() }));
vi.mock("@/lib/schools/server", async importOriginal => {
  const real = await importOriginal<typeof import("@/lib/schools/server")>();
  return { ...real, schoolDatabase: mocks.db, schoolAuth: mocks.auth, memberForUser: mocks.member, issueSchoolSession: mocks.issue };
});
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit: () => true, consumeAnalysisQuota: mocks.quota }));
import { POST, PUT, DELETE } from "@/app/api/schools/auth/route";

const request = (method: string, body?: unknown, cookie = "") => new Request("http://localhost/api/schools/auth", { method, headers: { origin: "http://localhost", cookie, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
beforeEach(() => {
  vi.resetAllMocks(); process.env.NEXT_PUBLIC_APP_URL = "http://localhost";
  mocks.quota.mockResolvedValue({ allowed: true });
  mocks.auth.mockReturnValue({ verifier: () => "test-pkce-verifier", client: { auth: { signInWithOtp: mocks.signin, exchangeCodeForSession: mocks.exchange, getUser: mocks.user } } });
  mocks.signin.mockResolvedValue({ error: null });
});

describe("school magic-link flow", () => {
  it("never registers an arbitrary visitor and sends links only to an enrolled address", async () => {
    mocks.db.mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) });
    const response = await POST(request("POST", { email: "visitor@example.com" }));
    expect(response.status).toBe(200); expect(mocks.signin).not.toHaveBeenCalled();
    expect(await response.json()).toHaveProperty("message");
  });
  it("uses PKCE, disables signup, and stores the verifier in an HttpOnly cookie", async () => {
    mocks.db.mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: "member" }, error: null }) }) }) }) });
    const response = await POST(request("POST", { email: "MEMBER@example.com" }));
    expect(response.status).toBe(200);
    expect(mocks.signin).toHaveBeenCalledWith({ email: "member@example.com", options: { shouldCreateUser: false, emailRedirectTo: "http://localhost/dla-szkol/potwierdz" } });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("does not exchange a code without the initiating browser verifier", async () => {
    const response = await PUT(request("PUT", { code: "valid-looking-code" }));
    expect(response.status).toBe(400); expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("returns a Preview magic link to the deployment that started PKCE", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.db.mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: "member" }, error: null }) }) }) }) });
    const origin = "https://cvunfold-test-pawelmaczkaczarneckis-projects.vercel.app";
    try {
      const response = await POST(new Request(`${origin}/api/schools/auth`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: "member@example.com" }) }));
      expect(response.status).toBe(200);
      expect(mocks.signin).toHaveBeenCalledWith({ email: "member@example.com", options: { shouldCreateUser: false, emailRedirectTo: `${origin}/dla-szkol/potwierdz` } });
    } finally { vi.unstubAllEnvs(); }
  });
  it("does not create a school session when a one-time link is expired or reused", async () => {
    mocks.exchange.mockResolvedValue({ data: { session: null }, error: new Error("expired") });
    const response = await PUT(request("PUT", { code: "valid-looking-code" }, "cvunfold_school_pkce=verifier"));
    expect(response.status).toBe(400); expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("checks server-verified identity and membership before issuing an opaque session", async () => {
    mocks.exchange.mockResolvedValue({ data: { session: { access_token: "test-only-token" } }, error: null });
    mocks.user.mockResolvedValue({ data: { user: { id: "member" } }, error: null });
    mocks.member.mockResolvedValue({ userId: "member" }); mocks.issue.mockResolvedValue("a".repeat(43));
    const response = await PUT(request("PUT", { code: "valid-looking-code" }, "cvunfold_school_pkce=verifier"));
    expect(response.status).toBe(200); expect(mocks.member).toHaveBeenCalledWith("member");
    expect(response.headers.get("set-cookie")).toContain("cvunfold_school_session=");
    expect(JSON.stringify(await response.json())).not.toContain("test-only-token");
  });
  it("logout deletes the server session rather than only removing the browser cookie", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mocks.db.mockReturnValue({ from: () => ({ delete: () => ({ eq }) }) });
    const response = await DELETE(request("DELETE", undefined, `cvunfold_school_session=${"a".repeat(43)}`));
    expect(response.status).toBe(200); expect(eq).toHaveBeenCalledWith("token_hash", expect.any(String));
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
