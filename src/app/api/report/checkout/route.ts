import { NextResponse } from "next/server";
import { getAnalysis, markAnalysisPaid, recordFunnelEvent } from "@/lib/data/store";
import { createCheckout } from "@/lib/payments/stripe";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { measurementContextFromAttribution } from "@/lib/audience";
import { TEASER_VARIANT } from "@/lib/analytics/events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  if (item.paid) return NextResponse.json({ paid: true });
  if (process.env.MOCK_MODE === "true" && process.env.NODE_ENV !== "production") {
    await markAnalysisPaid(token);
    return NextResponse.json({ unlocked: true });
  }
  try {
    const url = await createCheckout(item, new URL(request.url).origin);
    await recordFunnelEvent({
      name: "checkout_started",
      analysisId: item.id,
      locale: item.locale,
      market: item.market,
      properties: { plan: item.plan, teaser_variant: TEASER_VARIANT, ...measurementContextFromAttribution(item.attribution) },
      dedupeKey: `checkout-started:${item.id}`,
    }).catch(() => undefined);
    return NextResponse.json({ url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "STRIPE_CHECKOUT_FAILED";
    const configurationError = ["STRIPE_NOT_CONFIGURED", "STRIPE_PRICE_NOT_CONFIGURED", "STRIPE_PRICE_MISMATCH", "APP_URL_NOT_CONFIGURED", "APP_URL_NOT_SECURE"].includes(code);
    return NextResponse.json({ error: configurationError ? "PAYMENTS_NOT_CONFIGURED" : "CHECKOUT_FAILED" }, { status: configurationError ? 503 : 502 });
  }
}
