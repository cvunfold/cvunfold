import { reportRequestMatches } from "@/lib/security/report-session";
import { NextResponse } from "next/server";
import { getAnalysis, recordFunnelEvent } from "@/lib/data/store";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { measurementContextFromAttribution } from "@/lib/audience";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  await recordFunnelEvent({
    name: "checkout_cancelled",
    analysisId: item.id,
    locale: item.locale,
    market: item.market,
    properties: { plan: item.plan, ...measurementContextFromAttribution(item.attribution) },
    dedupeKey: `checkout-cancelled:${item.id}`,
  });
  return new NextResponse(null, { status: 204 });
}
