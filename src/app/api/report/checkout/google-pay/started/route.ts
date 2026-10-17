import { reportRequestMatches } from "@/lib/security/report-session";
import { hasReportCodeAccess } from "@/lib/security/report-access-code";
import { NextResponse } from "next/server";
import { getAnalysis, recordFunnelEvent } from "@/lib/data/store";
import { measurementContextFromAttribution } from "@/lib/audience";
import { markExpressWalletCheckoutStarted } from "@/lib/payments/stripe";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { TEASER_VARIANT } from "@/lib/analytics/events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  if (hasReportCodeAccess(item)) return NextResponse.json({ error: "REPORT_ALREADY_UNLOCKED" }, { status: 409 });
  const body = await request.json().catch(() => ({})) as { sessionId?: unknown };
  if (typeof body.sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(body.sessionId) || body.sessionId.length > 255) {
    return NextResponse.json({ error: "CHECKOUT_SESSION_INVALID" }, { status: 400 });
  }

  try {
    await markExpressWalletCheckoutStarted(body.sessionId, item.id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "STRIPE_CHECKOUT_FAILED";
    if (code === "STRIPE_ANALYSIS_MISMATCH") return NextResponse.json({ error: "CHECKOUT_SESSION_NOT_FOUND" }, { status: 404 });
    if (code === "STRIPE_NOT_CONFIGURED") return NextResponse.json({ error: "PAYMENTS_NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json({ error: "CHECKOUT_FAILED" }, { status: 502 });
  }

  await recordFunnelEvent({
    name: "checkout_started",
    analysisId: item.id,
    locale: item.locale,
    market: item.market,
    properties: { plan: item.plan, teaser_variant: TEASER_VARIANT, ...measurementContextFromAttribution(item.attribution) },
    dedupeKey: `checkout-started:${item.id}`,
  }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
