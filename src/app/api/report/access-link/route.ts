import { NextResponse } from "next/server";
import { getAnalysis, rotateAnalysisToken } from "@/lib/data/store";
import { reportPath } from "@/lib/i18n";
import { createAccessToken } from "@/lib/security/tokens";
import { reportTokenFromRequest, setReportSessionCookie } from "@/lib/security/report-session";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const nextToken = createAccessToken();
  if (!await rotateAnalysisToken(token, nextToken)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const response = NextResponse.json({ url: `${new URL(reportPath(item.locale), appUrl).toString()}#${nextToken}` }, { headers: { "Cache-Control": "no-store" } });
  setReportSessionCookie(response, nextToken, item.expiresAt);
  return response;
}
