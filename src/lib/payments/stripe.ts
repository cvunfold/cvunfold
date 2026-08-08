import Stripe from "stripe";
import type { Analysis } from "@/lib/data/store";
import { fulfillStripePayment, savePendingPayment } from "@/lib/data/store";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_NOT_CONFIGURED");
  stripeClient ??= new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });
  return stripeClient;
}

export function priceForPlan(plan: Analysis["plan"]): string {
  const price = plan === "job_match" ? process.env.STRIPE_PRICE_JOB_MATCH : process.env.STRIPE_PRICE_FULL_REVIEW;
  if (!price) throw new Error("STRIPE_PRICE_NOT_CONFIGURED");
  return price;
}

function appUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("APP_URL_NOT_CONFIGURED");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("APP_URL_NOT_SECURE");
  return url.origin;
}

export async function createCheckout(analysis: Analysis, token: string): Promise<string> {
  const stripe = getStripe();
  const price = priceForPlan(analysis.plan);
  const reportUrl = `${appUrl()}/pl/raport/${encodeURIComponent(token)}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: analysis.id,
    metadata: { analysis_id: analysis.id, plan: analysis.plan },
    payment_intent_data: { metadata: { analysis_id: analysis.id, plan: analysis.plan } },
    success_url: `${reportUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${reportUrl}?checkout=cancelled`,
  }, { idempotencyKey: `analysis:${analysis.id}:${price}` });
  if (!session.url || session.amount_total == null || !session.currency) throw new Error("STRIPE_CHECKOUT_FAILED");
  await savePendingPayment({
    analysisId: analysis.id,
    checkoutSessionId: session.id,
    plan: analysis.plan,
    amountGross: session.amount_total,
    currency: session.currency,
  });
  return session.url;
}

export async function fulfillCheckoutSession(sessionId: string, eventId: string, expectedAnalysisId?: string): Promise<boolean> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return false;
  const analysisId = session.metadata?.analysis_id;
  const plan = session.metadata?.plan;
  if (!analysisId || (plan !== "full_review" && plan !== "job_match")) throw new Error("STRIPE_METADATA_INVALID");
  if (expectedAnalysisId && analysisId !== expectedAnalysisId) throw new Error("STRIPE_ANALYSIS_MISMATCH");
  if (session.amount_total == null || !session.currency) throw new Error("STRIPE_PAYMENT_INVALID");
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  return fulfillStripePayment({
    eventId,
    analysisId,
    checkoutSessionId: session.id,
    paymentIntentId: paymentIntentId || null,
    customerId: customerId || null,
    plan,
    amountGross: session.amount_total,
    currency: session.currency,
  });
}
