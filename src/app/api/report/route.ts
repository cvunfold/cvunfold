import { reportRequestMatches } from "@/lib/security/report-session";
import { hasReportTestAccess } from "@/lib/security/report-test-access";
import { hasReportCodeAccess } from "@/lib/security/report-access-code";
import { NextResponse } from "next/server";
import { deleteAnalysis, getAnalysis, getReportRevisions, recordFunnelEvent, type Revision } from "@/lib/data/store";
import { toTeaser, withRecruiterPerspective } from "@/lib/ai/validate-report";
import { fulfillCheckoutSession } from "@/lib/payments/stripe";
import { clearReportSessionCookie, reportTokenFromRequest } from "@/lib/security/report-session";
import { measurementContextFromAttribution } from "@/lib/audience";
import { TEASER_VARIANT } from "@/lib/analytics/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  let item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const params = new URL(request.url).searchParams;
  if (params.get("id") && params.get("id") !== item.id) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  const testAccess = hasReportTestAccess(request, token);
  const codeAccess = hasReportCodeAccess(item);
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!item.paid && !codeAccess && !testAccess && sessionId && process.env.MOCK_MODE !== "true") {
    try {
      await fulfillCheckoutSession(sessionId, `checkout-verify:${sessionId}`, item.id);
      item = await getAnalysis(token) || item;
    } catch {
      // The signed webhook remains authoritative; the UI keeps polling safely.
    }
  }
  const fullAccess = item.paid || codeAccess || testAccess;
  let revisions: Revision[] = [];
  let iterationsAvailable = item.plan === "full_review";
  if (fullAccess && iterationsAvailable) {
    try { revisions = await getReportRevisions(item); }
    catch { iterationsAvailable = false; }
  }
  const completed = revisions.filter(row => row.status === "complete" && row.report);
  const version = params.get("version") === null ? (completed.at(-1)?.version || 0) : Number(params.get("version"));
  const selected = version === 0 ? item.report : completed.find(row => row.version === version)?.report;
  if (!selected) return NextResponse.json({ error: "VERSION_NOT_FOUND" }, { status: 404 });
  const report = withRecruiterPerspective(selected);
  const measurementContext = measurementContextFromAttribution(item.attribution);
  if (!testAccess) await recordFunnelEvent({
    name: fullAccess ? "full_report_viewed" : "teaser_viewed",
    analysisId: item.id,
    locale: item.locale,
    market: item.market,
    properties: { plan: item.plan, ...(fullAccess ? {} : { teaser_variant: TEASER_VARIANT }), ...measurementContext },
    dedupeKey: `${fullAccess ? "full-report-viewed" : "teaser-viewed"}:${item.id}`,
  }).catch(() => undefined);
  return NextResponse.json({
    iterationsAvailable,
    analysisId: item.id,
    version,
    revisions: fullAccess ? [{ version: 0, createdAt: item.createdAt.toISOString(), score: item.report.summary.overallScore }, ...completed.map(row => ({ version: row.version, createdAt: row.createdAt, score: row.report!.summary.overallScore }))] : [],
    rechecksRemaining: fullAccess && iterationsAvailable ? 2 - completed.length : 0,
    recheckRunning: revisions.some(row => row.status === "running" && row.leaseUntil > Date.now()),
    paid: item.paid,
    fullAccess,
    accessMode: item.paid ? "purchase" : codeAccess ? "access_code" : testAccess ? "preview_test" : "teaser",
    plan: item.plan,
    locale: item.locale,
    expiresAt: item.expiresAt.toISOString(),
    report: fullAccess ? report : toTeaser(report),
    purchase: item.paid ? item.purchase : undefined,
    measurementContext,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}

export async function DELETE(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  await recordFunnelEvent({ name: "delete_requested", locale: item.locale, market: item.market, properties: { plan: item.plan, ...measurementContextFromAttribution(item.attribution) } }).catch(() => undefined);
  const removed = await deleteAnalysis(token);
  const response = removed ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  clearReportSessionCookie(response, item.id);
  return response;
}
