import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnalysis } from "@/lib/data/store";
import { reportPath } from "@/lib/i18n";
import { isAccessToken, setReportSessionCookie } from "@/lib/security/report-session";

const schema = z.object({ token: z.string() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAccessToken(parsed.data.token)) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  const analysis = await getAnalysis(parsed.data.token);
  if (!analysis) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const response = NextResponse.json({ ok: true, locale: analysis.locale, path: reportPath(analysis.locale) }, {
    headers: { "Cache-Control": "no-store" },
  });
  setReportSessionCookie(response, parsed.data.token, analysis.expiresAt);
  return response;
}
