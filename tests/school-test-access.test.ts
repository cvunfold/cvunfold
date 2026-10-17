import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasSchoolTestAccess } from "@/lib/schools/test-access";
const now = Date.now();
const member = { userId: "test-owner", schoolId: "test-school" };
const localRequest = new Request("http://localhost/api/schools", { headers: { host: "127.0.0.1:3108" } });
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL_ENV", ""); vi.stubEnv("VERCEL_TARGET_ENV", "");
  vi.stubEnv("SCHOOL_TEST_ACCESS_ENABLED", "true"); vi.stubEnv("SCHOOL_TEST_ACCESS_USER_ID", member.userId);
  vi.stubEnv("SCHOOL_TEST_ACCESS_SCHOOL_ID", member.schoolId); vi.stubEnv("SCHOOL_TEST_ACCESS_GROUP_ID", "test-group");
  vi.stubEnv("SCHOOL_TEST_ACCESS_EXPIRES_AT", new Date(now + 3_600_000).toISOString());
});
afterEach(() => vi.unstubAllEnvs());
describe("owner-approved local school test access", () => {
  it("allows the separately configured synthetic group without granting other schools access", () => {
    vi.stubEnv("SCHOOL_TEST_ACCESS_ADDITIONAL_GROUP_ID", "synthetic-group");
    expect(hasSchoolTestAccess(localRequest, member, "synthetic-group", now)).toBe(true);
    expect(hasSchoolTestAccess(localRequest, { ...member, schoolId: "other-school" }, "synthetic-group", now)).toBe(false);
    expect(hasSchoolTestAccess(new Request("https://cvunfold.com/api/schools"), member, "synthetic-group", now)).toBe(false);
  });
  it("permits only the configured local owner, school and group", () => {
    expect(hasSchoolTestAccess(localRequest, member, "test-group", now)).toBe(true);
    expect(hasSchoolTestAccess(localRequest, { ...member, userId: "other-user" }, "test-group", now)).toBe(false);
    expect(hasSchoolTestAccess(localRequest, { ...member, schoolId: "other-school" }, "test-group", now)).toBe(false);
    expect(hasSchoolTestAccess(localRequest, member, "other-group", now)).toBe(false);
  });
  it("rejects public hosts even if other settings match", () => {
    expect(hasSchoolTestAccess(new Request("https://cvunfold.com/api/schools"), member, "test-group", now)).toBe(false);
  });
  it.each(["production", "preview"])("rejects Vercel %s even if NODE_ENV is accidentally development", environment => {
    vi.stubEnv("VERCEL_ENV", environment);
    expect(hasSchoolTestAccess(localRequest, member, "test-group", now)).toBe(false);
  });
  it("rejects production Node, expired, unbounded and disabled grants", () => {
    vi.stubEnv("NODE_ENV", "production"); expect(hasSchoolTestAccess(localRequest, member, "test-group", now)).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    for (const expiry of ["", "invalid", new Date(now - 1).toISOString(), new Date(now + 86_400_001).toISOString()]) {
      vi.stubEnv("SCHOOL_TEST_ACCESS_EXPIRES_AT", expiry); expect(hasSchoolTestAccess(localRequest, member, "test-group", now)).toBe(false);
    }
    vi.stubEnv("SCHOOL_TEST_ACCESS_EXPIRES_AT", new Date(now + 3_600_000).toISOString());
    vi.stubEnv("SCHOOL_TEST_ACCESS_ENABLED", "false"); expect(hasSchoolTestAccess(localRequest, member, "test-group", now)).toBe(false);
  });
});
