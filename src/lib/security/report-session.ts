import type { NextResponse } from "next/server";

export const REPORT_SESSION_COOKIE = "cv_review_report_session_v1";
const accessTokenPattern = /^[A-Za-z0-9_-]{40,64}$/;
const reportIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function isAccessToken(value: unknown): value is string {
  return typeof value === "string" && accessTokenPattern.test(value);
}

export function reportTokenFromRequest(request: Request): string | null {
  const queryId = new URL(request.url).searchParams.get("id");
  const headerId = request.headers.get("x-report-id");
  if (queryId && headerId && queryId !== headerId) return null;
  const reportId = headerId || queryId;
  if (reportId && !reportIdPattern.test(reportId)) return null;
  const cookie = request.headers.get("cookie") || "";
  let legacyToken: string | null = null;
  for (const pair of cookie.split(";")) {
    const [name, ...value] = pair.trim().split("=");
    if (name !== REPORT_SESSION_COOKIE && (!reportId || name !== `${REPORT_SESSION_COOKIE}_${reportId.toLowerCase()}`)) continue;
    let decoded: string;
    try { decoded = decodeURIComponent(value.join("=")); } catch { return null; }
    if (!isAccessToken(decoded)) return null;
    if (name !== REPORT_SESSION_COOKIE) return decoded;
    legacyToken = decoded;
  }
  return legacyToken;
}

export function setReportSessionCookie(response: NextResponse, token: string, expiresAt: Date, analysisId?: string): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/report",
    expires: expiresAt,
    priority: "high" as const,
  };
  // Retain the last-report cookie for existing generic links and older clients.
  response.cookies.set(REPORT_SESSION_COOKIE, token, options);
  if (analysisId && reportIdPattern.test(analysisId)) response.cookies.set(`${REPORT_SESSION_COOKIE}_${analysisId.toLowerCase()}`, token, options);
}

export function clearReportSessionCookie(response: NextResponse, analysisId?: string): void {
  setReportSessionCookie(response, "", new Date(0), analysisId);
}

export function reportRequestMatches(request: Request, analysisId: string): boolean {
  const queryId = new URL(request.url).searchParams.get("id");
  const headerId = request.headers.get("x-report-id");
  return (!queryId || queryId === analysisId) && (!headerId || headerId === analysisId);
}
