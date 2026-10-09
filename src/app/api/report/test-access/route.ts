import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/data/store";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/tokens";
import { createReportTestGrant, reportTestAccessEnabled, REPORT_TEST_ACCESS_COOKIE, TEST_ACCESS_SECONDS, validReportTestCode } from "@/lib/security/report-test-access";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  if (!reportTestAccessEnabled()) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers });
  const origin = request.headers.get("origin");
  if (origin) {
    // Next may use localhost internally while the browser connects to 127.0.0.1.
    // Compare the browser origin to the actual request Host, not that internal URL.
    let sameOrigin = false;
    try {
      const browserOrigin = new URL(origin);
      const internalUrl = new URL(request.url);
      const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || internalUrl.protocol.slice(0, -1);
      sameOrigin = browserOrigin.host === (request.headers.get("host") || internalUrl.host) && browserOrigin.protocol === `${protocol}:`;
    } catch { /* malformed origin */ }
    if (!sameOrigin) return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403, headers });
  }
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401, headers });
  if (!rateLimit(`test-access:${hashToken(token)}`, 5)) return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429, headers });
  const body = await request.json().catch(() => null);
  const code = request.headers.get("x-report-test-code") || body?.code;
  if (!validReportTestCode(code)) return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403, headers });
  const analysis = await getAnalysis(token);
  if (!analysis) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404, headers });
  const response = NextResponse.json({ unlocked: true, accessMode: "preview_test" }, { headers });
  response.cookies.set(REPORT_TEST_ACCESS_COOKIE, createReportTestGrant(token, analysis.expiresAt), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/report", maxAge: TEST_ACCESS_SECONDS,
  });
  return response;
}
