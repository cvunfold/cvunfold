import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckoutSession, getStripe, shouldRecordCheckoutExpired } from "@/lib/payments/stripe";
import { markStripePaymentTerminal, recordFunnelEvent, track } from "@/lib/data/store";
import { isPlan } from "@/lib/plans";
import { assertStripeLivemode } from "@/lib/payments/stripe-mode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
    assertStripeLivemode(event.livemode);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.school_group_id || session.metadata?.school_id || session.metadata?.package_version?.startsWith("school_")) return NextResponse.json({ received: true, ignored: "school_checkout_retired" });
      if (await fulfillCheckoutSession(session.id, event.id)) track("purchase_completed");
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.school_group_id || session.metadata?.school_id || session.metadata?.package_version?.startsWith("school_")) return NextResponse.json({ received: true, ignored: "school_checkout_retired" });
      await markStripePaymentTerminal(event.id, session.id, "failed");
      const analysisId = session.metadata?.analysis_id;
      const plan = session.metadata?.plan;
      const locale = session.metadata?.locale;
      const market = session.metadata?.market;
      const shouldRecord = event.type !== "checkout.session.expired" || shouldRecordCheckoutExpired(session);
      if (shouldRecord && analysisId && isPlan(plan) && (locale === "pl" || locale === "en") && (market === "pl" || market === "en")) {
        const name = event.type === "checkout.session.expired" ? "checkout_expired" : "payment_failed";
        await recordFunnelEvent({
          name,
          analysisId,
          locale,
          market,
          properties: { plan },
          dedupeKey: `stripe-${name}:${session.id}`,
        });
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
        const session = sessions.data[0];
        if (session?.metadata?.school_group_id || session?.metadata?.school_id || session?.metadata?.package_version?.startsWith("school_")) return NextResponse.json({ received: true, ignored: "school_checkout_retired" });
        if (session) await markStripePaymentTerminal(event.id, session.id, "refunded");
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
