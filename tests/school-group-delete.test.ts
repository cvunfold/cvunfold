import { beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ from: vi.fn(), client: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: fake.client }));
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit: fake.rateLimit }));
import { DELETE } from "@/app/api/schools/route";
import { SCHOOL_COOKIE } from "@/lib/schools/server";

const groupId = "11111111-1111-4111-8111-111111111111";
function query(result: unknown) {
  const chain = { select: vi.fn(), eq: vi.fn(), gt: vi.fn(), delete: vi.fn(), maybeSingle: vi.fn(async () => result) };
  for (const method of [chain.select, chain.eq, chain.gt, chain.delete]) method.mockReturnValue(chain);
  return chain;
}
function request(body: unknown = { groupId, confirmed: true }, origin = "http://localhost", cookie = `${SCHOOL_COOKIE}=${"a".repeat(43)}`) {
  return new Request("http://localhost/api/schools", { method: "DELETE", headers: { origin, cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
let deletion: ReturnType<typeof query>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-not-a-key");
  fake.rateLimit.mockReturnValue(true);
  deletion = query({ data: { id: groupId }, error: null });
  fake.client.mockReturnValue({ from: fake.from });
  fake.from.mockImplementation((table: string) => {
    if (table === "school_sessions") return query({ data: { user_id: "user-a" }, error: null });
    if (table === "school_members") return query({ data: { school_id: "school-a", schools: { name: "School A" } }, error: null });
    if (table === "school_groups") return deletion;
    throw new Error(`Unexpected table: ${table}`);
  });
});
import { afterEach } from "vitest";
afterEach(() => vi.unstubAllEnvs());

describe("group deletion", () => {
  it("deletes only the selected group owned by the authenticated school", async () => {
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deletion.delete).toHaveBeenCalledOnce();
    expect(deletion.eq).toHaveBeenCalledWith("id", groupId);
    expect(deletion.eq).toHaveBeenCalledWith("school_id", "school-a");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects unauthenticated requests before accessing the database", async () => {
    expect((await DELETE(request(undefined, "http://localhost", ""))).status).toBe(401);
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests before accessing the database", async () => {
    expect((await DELETE(request(undefined, "https://other.example"))).status).toBe(403);
    expect(fake.from).not.toHaveBeenCalled();
  });
  it.each([{ groupId }, { groupId, confirmed: false }, { groupId: "invalid", confirmed: true }])("requires a valid group and explicit confirmation: %j", async body => {
    expect((await DELETE(request(body))).status).toBe(400);
    expect(deletion.delete).not.toHaveBeenCalled();
  });
  it("returns 404 for foreign, missing or already deleted groups", async () => {
    deletion.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await DELETE(request())).status).toBe(404);
    expect(deletion.eq).toHaveBeenCalledWith("school_id", "school-a");
  });
  it("reports database failures without claiming success", async () => {
    deletion.maybeSingle.mockResolvedValue({ data: null, error: { message: "failure" } });
    expect((await DELETE(request())).status).toBe(503);
  });
  it("enforces the deletion rate limit", async () => {
    fake.rateLimit.mockReturnValue(false);
    expect((await DELETE(request())).status).toBe(429);
    expect(deletion.delete).not.toHaveBeenCalled();
  });
});
