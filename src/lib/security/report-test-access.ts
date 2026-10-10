import { createHmac } from "node:crypto";
import { constantTimeEqual, hashToken } from "./tokens";

export const REPORT_TEST_ACCESS_COOKIE = "cv_report_test_access_v1";
export const TEST_ACCESS_SECONDS = 30 * 60;

function grantSecret(): string {
  return process.env.REPORT_TEST_ACCESS_SECRET || process.env.REPORT_TEST_ACCESS_CODE || "";
}

export function reportTestAccessEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_TARGET_ENV === "production") return false;
  const preview = process.env.VERCEL_ENV === "preview";
  const local = !process.env.VERCEL_ENV && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
  return (preview || local) && process.env.REPORT_TEST_ACCESS_ENABLED === "true"
    && (process.env.REPORT_TEST_ACCESS_CODE?.length || 0) >= 4
    && grantSecret().length >= 32
    && grantSecret().length <= 256
    && (process.env.REPORT_TEST_ACCESS_CODE?.length || 0) <= 256;
}

function signature(value: string): string {
  return createHmac("sha256", grantSecret()).update(`report-test-access:${hashToken(process.env.REPORT_TEST_ACCESS_CODE!)}:${value}`).digest("base64url");
}

export function validReportTestCode(code: unknown): boolean {
  return reportTestAccessEnabled() && typeof code === "string" && code.length <= 256
    && constantTimeEqual(hashToken(code), hashToken(process.env.REPORT_TEST_ACCESS_CODE!));
}

export function createReportTestGrant(token: string, expiresAt: Date): string {
  if (!reportTestAccessEnabled()) throw new Error("TEST_ACCESS_DISABLED");
  const expires = Math.min(Date.now() + TEST_ACCESS_SECONDS * 1000, expiresAt.getTime());
  const value = `${hashToken(token)}.${expires}`;
  return `${value}.${signature(value)}`;
}

export function hasReportTestAccess(request: Request, token: string): boolean {
  if (!reportTestAccessEnabled()) return false;
  const cookie = (request.headers.get("cookie") || "").split(";").map(part => part.trim())
    .find(part => part.startsWith(`${REPORT_TEST_ACCESS_COOKIE}=`))?.slice(REPORT_TEST_ACCESS_COOKIE.length + 1);
  if (!cookie || cookie.length > 200) return false;
  const [tokenHash, expires, signed, extra] = cookie.split(".");
  const timestamp = Number(expires);
  if (extra || !tokenHash || !signed || !Number.isFinite(timestamp) || timestamp <= Date.now()
    || timestamp > Date.now() + TEST_ACCESS_SECONDS * 1000) return false;
  return constantTimeEqual(tokenHash, hashToken(token)) && constantTimeEqual(signed, signature(`${tokenHash}.${expires}`));
}
