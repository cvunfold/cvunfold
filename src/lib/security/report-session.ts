import type { NextResponse } from "next/server";

export const REPORT_SESSION_COOKIE = "cv_review_report_session_v1";
const accessTokenPattern = /^[A-Za-z0-9_-]{40,64}$/;

export function isAccessToken(value: unknown): value is string {
  return typeof value === "string" && accessTokenPattern.test(value);
}

export function reportTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  for (const pair of cookie.split(";")) {
    const [name, ...value] = pair.trim().split("=");
    if (name === REPORT_SESSION_COOKIE) {
      const decoded = decodeURIComponent(value.join("="));
      return isAccessToken(decoded) ? decoded : null;
    }
  }
  return null;
}

export function setReportSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(REPORT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/report",
    expires: expiresAt,
    priority: "high",
  });
}

export function clearReportSessionCookie(response: NextResponse): void {
  response.cookies.set(REPORT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/report",
    expires: new Date(0),
  });
}
