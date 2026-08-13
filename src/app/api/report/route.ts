import { NextResponse } from "next/server";
import { deleteAnalysis, getAnalysis, recordFunnelEvent } from "@/lib/data/store";
import { toTeaser, withRecruiterPerspective } from "@/lib/ai/validate-report";
import { fulfillCheckoutSession } from "@/lib/payments/stripe";
import { clearReportSessionCookie, reportTokenFromRequest } from "@/lib/security/report-session";
import { measurementContextFromAttribution } from "@/lib/audience";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  let item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!item.paid && sessionId && process.env.MOCK_MODE !== "true") {
    try {
      await fulfillCheckoutSession(sessionId, `checkout-verify:${sessionId}`, item.id);
      item = await getAnalysis(token) || item;
    } catch {
      // The signed webhook remains authoritative; the UI keeps polling safely.
    }
  }
  const report = withRecruiterPerspective(item.report);
  const measurementContext = measurementContextFromAttribution(item.attribution);
  await recordFunnelEvent({
    name: item.paid ? "full_report_viewed" : "teaser_viewed",
    analysisId: item.id,
    locale: item.locale,
    market: item.market,
    properties: { plan: item.plan, ...measurementContext },
    dedupeKey: `${item.paid ? "full-report-viewed" : "teaser-viewed"}:${item.id}`,
  }).catch(() => undefined);
  return NextResponse.json({
    paid: item.paid,
    plan: item.plan,
    locale: item.locale,
    expiresAt: item.expiresAt.toISOString(),
    report: item.paid ? report : toTeaser(report),
    purchase: item.paid ? item.purchase : undefined,
    measurementContext,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}

export async function DELETE(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  await recordFunnelEvent({ name: "delete_requested", locale: item.locale, market: item.market, properties: { plan: item.plan, ...measurementContextFromAttribution(item.attribution) } }).catch(() => undefined);
  const removed = await deleteAnalysis(token);
  const response = removed ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  clearReportSessionCookie(response);
  return response;
}
