import { NextResponse } from "next/server";
import { getAnalysis, grantReportCodeAccess } from "@/lib/data/store";
import { reportRequestMatches, reportTokenFromRequest } from "@/lib/security/report-session";
import { ACCESS_CODE_COOKIE, ACCESS_CODE_SECONDS, createPendingCodeGrant, reportAccessCodesEnabled, validateReportAccessCode } from "@/lib/security/report-access-code";
import { consumeAnalysisQuota, rateLimit } from "@/lib/security/rate-limit";
import { hmacIdentifier } from "@/lib/security/tokens";
import { requireSameOrigin } from "@/lib/schools/server";
import { RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function POST(request: Request) {
  if (!reportAccessCodesEnabled()) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers });
  try { requireSameOrigin(request); } catch { return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403, headers }); }
  if (Number(request.headers.get("content-length")) > 2048) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400, headers });
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const subject = hmacIdentifier(`access-code:${ip}`);
  try {
    if (!rateLimit(subject, 5) || !(await consumeAnalysisQuota(subject, 10, 30)).allowed) return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429, headers });
    const body = await request.json().catch(() => null);
    const codeHash = validateReportAccessCode(body?.code);
    if (!codeHash) return NextResponse.json({ error: "INVALID_CODE" }, { status: 403, headers });
    if (body?.analysisId !== undefined) {
      const token = reportTokenFromRequest(request);
      if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401, headers });
      const item = await getAnalysis(token);
      if (!item || item.id !== body.analysisId || !reportRequestMatches(request, item.id) || item.schoolGroupId) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404, headers });
      if (item.plan === "full_review" && item.report.rubricVersion === RUBRIC_VERSION) {
        if (!await grantReportCodeAccess(token, codeHash)) throw new Error("GRANT_FAILED");
        return NextResponse.json({ unlocked: true, accessMode: "access_code" }, { headers });
      }
      // Keep the voucher for a fresh analysis when the old report cannot
      // support the advertised rechecks under the current criteria.
    }
    const response = NextResponse.json({ accepted: true, ...(body?.analysisId ? { newAnalysisRequired: true } : {}) }, { headers });
    response.cookies.set(ACCESS_CODE_COOKIE, createPendingCodeGrant(codeHash), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: ACCESS_CODE_SECONDS });
    return response;
  } catch { return NextResponse.json({ error: "CODE_ACCESS_UNAVAILABLE" }, { status: 503, headers }); }
}
