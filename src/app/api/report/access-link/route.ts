import { reportRequestMatches } from "@/lib/security/report-session";
import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/data/store";
import { reportPath } from "@/lib/i18n";
import { reportTokenFromRequest, setReportSessionCookie } from "@/lib/security/report-session";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  // On Vercel Preview each deployment has its own ephemeral URL, so a fixed
  // NEXT_PUBLIC_APP_URL there would send the access link to the wrong preview.
  const appUrl = (process.env.VERCEL_ENV === "preview" ? null : process.env.NEXT_PUBLIC_APP_URL) || new URL(request.url).origin;
  const response = NextResponse.json({ url: `${new URL(`${reportPath(item.locale)}/${item.id}`, appUrl).toString()}#${token}` }, { headers: { "Cache-Control": "no-store" } });
  setReportSessionCookie(response, token, item.expiresAt, item.id);
  return response;
}
