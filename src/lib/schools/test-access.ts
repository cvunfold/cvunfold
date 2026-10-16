import type { SchoolMember } from "./server";

/** Owner-approved local QA access. Never changes payment state or grants table access. */
export function hasSchoolTestAccess(request: Request, member: Pick<SchoolMember, "userId" | "schoolId">, groupId: string, now = Date.now()): boolean {
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") return false;
  if (process.env.VERCEL_ENV || process.env.VERCEL_TARGET_ENV || process.env.SCHOOL_TEST_ACCESS_ENABLED !== "true") return false;
  try {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.host;
    const hostname = new URL(`http://${host}`).hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return false;
  } catch { return false; }
  if (!process.env.SCHOOL_TEST_ACCESS_USER_ID || !process.env.SCHOOL_TEST_ACCESS_SCHOOL_ID || !process.env.SCHOOL_TEST_ACCESS_GROUP_ID) return false;
  if (member.userId !== process.env.SCHOOL_TEST_ACCESS_USER_ID || member.schoolId !== process.env.SCHOOL_TEST_ACCESS_SCHOOL_ID
    || ![process.env.SCHOOL_TEST_ACCESS_GROUP_ID, process.env.SCHOOL_TEST_ACCESS_ADDITIONAL_GROUP_ID].filter(Boolean).includes(groupId)) return false;
  const expiry = Date.parse(process.env.SCHOOL_TEST_ACCESS_EXPIRES_AT || "");
  return Number.isFinite(expiry) && expiry > now && expiry <= now + 86_400_000;
}
