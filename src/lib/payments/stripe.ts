import Stripe from "stripe";
import type { Analysis } from "@/lib/data/store";
import { fulfillStripePayment, savePendingPayment } from "@/lib/data/store";
import { reportPath } from "@/lib/i18n";
import { getPlanDefinition, isPlan, type Plan } from "@/lib/plans";

let stripeClient: Stripe | undefined;

type CheckoutSurface = "hosted" | "express_wallet";
type CheckoutAnalysis = Pick<Analysis, "id" | "plan" | "locale" | "market">;

const CHECKOUT_INTEGRATION_IDENTIFIERS = {
  hosted: "cvunfold_hosted_kjtrmvnq",
  express_wallet: "cvunfold_wallet_gpsxwzke",
} as const;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_NOT_CONFIGURED");
  stripeClient ??= new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });
  return stripeClient;
}

export function priceForPlan(plan: Plan, locale: Analysis["locale"] = "pl"): string {
  const definition = getPlanDefinition(plan, locale);
  const price = process.env[definition.stripePriceEnv];
  if (!price) throw new Error("STRIPE_PRICE_NOT_CONFIGURED");
  return price;
}

function appUrl(requestOrigin?: string): string {
  // Vercel Preview deployments each get their own ephemeral URL, so a fixed
  // NEXT_PUBLIC_APP_URL there always points at whichever preview happened to
  // be configured last. Use the requesting deployment's own origin instead.
  if (process.env.VERCEL_ENV === "preview" && requestOrigin) return requestOrigin;
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("APP_URL_NOT_CONFIGURED");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("APP_URL_NOT_SECURE");
  return url.origin;
}

export function buildCheckoutSessionParams(
  analysis: CheckoutAnalysis,
  price: string,
  reportUrl: string,
  surface: CheckoutSurface,
): Stripe.Checkout.SessionCreateParams {
  const metadata = {
    analysis_id: analysis.id,
    plan: analysis.plan,
    locale: analysis.locale,
    market: analysis.market,
    checkout_surface: surface,
    buyer_confirmed: surface === "hosted" ? "true" : "false",
  };
  const common = {
    mode: "payment" as const,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: analysis.id,
    locale: analysis.locale === "pl" ? "pl" as const : "en" as const,
    metadata,
    payment_intent_data: { metadata },
    integration_identifier: CHECKOUT_INTEGRATION_IDENTIFIERS[surface],
  };

  if (surface === "express_wallet") {
    return {
      ...common,
      // Managed Payments only supports hosted or embedded Checkout surfaces.
      // Express Checkout requires the custom Elements surface instead.
      managed_payments: { enabled: false },
      // The 2026-07-29 API names the custom Checkout Elements surface `elements`.
      ui_mode: "elements",
      return_url: `${reportUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    };
  }

  return {
    ...common,
    success_url: `${reportUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${reportUrl}?checkout=cancelled`,
  };
}

export function checkoutIdempotencyKey(analysisId: string, price: string, surface: CheckoutSurface): string {
  const version = "v1";
  return `analysis:${analysisId}:${price}:${surface}:${version}`;
}

async function createValidatedCheckoutSession(analysis: Analysis, surface: CheckoutSurface, requestOrigin?: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const definition = getPlanDefinition(analysis.plan, analysis.locale);
  const price = priceForPlan(analysis.plan, analysis.locale);
  const stripePrice = await stripe.prices.retrieve(price);
  if (!stripePrice.active || stripePrice.recurring || stripePrice.unit_amount !== definition.amountMinor
    || stripePrice.currency.toUpperCase() !== definition.currency) throw new Error("STRIPE_PRICE_MISMATCH");
  const reportUrl = `${appUrl(requestOrigin)}${reportPath(analysis.locale)}`;
  const session = await stripe.checkout.sessions.create(
    buildCheckoutSessionParams(analysis, stripePrice.id, reportUrl, surface),
    { idempotencyKey: checkoutIdempotencyKey(analysis.id, price, surface) },
  );
  if (session.amount_total == null || !session.currency) throw new Error("STRIPE_CHECKOUT_FAILED");
  await savePendingPayment({
    analysisId: analysis.id,
    checkoutSessionId: session.id,
    plan: analysis.plan,
    locale: analysis.locale,
    market: analysis.market,
    amountGross: session.amount_total,
    currency: session.currency,
    livemode: session.livemode,
  });
  return session;
}

export async function createCheckout(analysis: Analysis, requestOrigin?: string): Promise<string> {
  const session = await createValidatedCheckoutSession(analysis, "hosted", requestOrigin);
  if (!session.url) throw new Error("STRIPE_CHECKOUT_FAILED");
  return session.url;
}

export async function createExpressWalletCheckout(analysis: Analysis, requestOrigin?: string): Promise<string> {
  const session = await createValidatedCheckoutSession(analysis, "express_wallet", requestOrigin);
  if (!session.client_secret) throw new Error("STRIPE_CHECKOUT_FAILED");
  return session.client_secret;
}

export async function markExpressWalletCheckoutStarted(sessionId: string, expectedAnalysisId: string): Promise<void> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.analysis_id !== expectedAnalysisId || session.metadata?.checkout_surface !== "express_wallet") {
    throw new Error("STRIPE_ANALYSIS_MISMATCH");
  }
  await stripe.checkout.sessions.update(session.id, { metadata: { buyer_confirmed: "true" } });
}

export function shouldRecordCheckoutExpired(session: Pick<Stripe.Checkout.Session, "metadata">): boolean {
  return session.metadata?.checkout_surface !== "express_wallet" || session.metadata?.buyer_confirmed === "true";
}

export async function fulfillCheckoutSession(sessionId: string, eventId: string, expectedAnalysisId?: string): Promise<boolean> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return false;
  const analysisId = session.metadata?.analysis_id;
  const plan = session.metadata?.plan;
  const locale = session.metadata?.locale;
  const market = session.metadata?.market;
  if (!analysisId || !isPlan(plan) || (locale !== "pl" && locale !== "en") || (market !== "pl" && market !== "en")) throw new Error("STRIPE_METADATA_INVALID");
  if (expectedAnalysisId && analysisId !== expectedAnalysisId) throw new Error("STRIPE_ANALYSIS_MISMATCH");
  if (session.amount_total == null || !session.currency) throw new Error("STRIPE_PAYMENT_INVALID");
  const definition = getPlanDefinition(plan, locale);
  if (session.amount_total !== definition.amountMinor || session.currency.toUpperCase() !== definition.currency || market !== definition.market) {
    throw new Error("STRIPE_PAYMENT_MISMATCH");
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  return fulfillStripePayment({
    eventId,
    analysisId,
    checkoutSessionId: session.id,
    paymentIntentId: paymentIntentId || null,
    customerId: customerId || null,
    plan,
    locale,
    market,
    amountGross: session.amount_total,
    currency: session.currency,
  });
}
