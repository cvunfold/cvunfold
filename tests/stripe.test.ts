import { afterEach, describe, expect, it } from "vitest";
import { buildCheckoutSessionParams, checkoutIdempotencyKey, priceForPlan, shouldRecordCheckoutExpired } from "@/lib/payments/stripe";
import { readFileSync } from "node:fs";

const originalFullPrice = process.env.STRIPE_PRICE_FULL_REVIEW;
const originalJobPrice = process.env.STRIPE_PRICE_JOB_MATCH;
const originalFullEurPrice = process.env.STRIPE_PRICE_FULL_REVIEW_EUR;
const originalJobEurPrice = process.env.STRIPE_PRICE_JOB_MATCH_EUR;

afterEach(() => {
  if (originalFullPrice === undefined) delete process.env.STRIPE_PRICE_FULL_REVIEW;
  else process.env.STRIPE_PRICE_FULL_REVIEW = originalFullPrice;
  if (originalJobPrice === undefined) delete process.env.STRIPE_PRICE_JOB_MATCH;
  else process.env.STRIPE_PRICE_JOB_MATCH = originalJobPrice;
  if (originalFullEurPrice === undefined) delete process.env.STRIPE_PRICE_FULL_REVIEW_EUR; else process.env.STRIPE_PRICE_FULL_REVIEW_EUR = originalFullEurPrice;
  if (originalJobEurPrice === undefined) delete process.env.STRIPE_PRICE_JOB_MATCH_EUR; else process.env.STRIPE_PRICE_JOB_MATCH_EUR = originalJobEurPrice;
});

describe("Stripe price boundary", () => {
  const analysis = { id: "analysis_123", plan: "full_review" as const, locale: "pl" as const, market: "pl" as const };

  it("maps each report plan to its own server-side price", () => {
    process.env.STRIPE_PRICE_FULL_REVIEW = "price_full";
    process.env.STRIPE_PRICE_JOB_MATCH = "price_match";
    expect(priceForPlan("full_review")).toBe("price_full");
    expect(priceForPlan("job_match")).toBe("price_match");
  });

  it("fails closed when a plan has no configured price", () => {
    delete process.env.STRIPE_PRICE_JOB_MATCH;
    expect(() => priceForPlan("job_match")).toThrow("STRIPE_PRICE_NOT_CONFIGURED");
  });

  it("uses separate EUR prices for the English market", () => {
    process.env.STRIPE_PRICE_FULL_REVIEW_EUR = "price_full_eur";
    process.env.STRIPE_PRICE_JOB_MATCH_EUR = "price_match_eur";
    expect(priceForPlan("full_review", "en")).toBe("price_full_eur");
    expect(priceForPlan("job_match", "en")).toBe("price_match_eur");
  });

  it("keeps webhook fulfillment idempotent and purchase recording server-side", () => {
    const migration = readFileSync("supabase/migrations/20260809170853_launch_readiness.sql", "utf8");
    expect(migration).toContain("webhook_events");
    expect(migration).toContain("stripe-purchase:");
    expect(migration).toContain("on conflict (dedupe_key)");
  });

  it("records failed and expired checkout states with dedupe keys", () => {
    const webhook = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
    expect(webhook).toContain('"checkout_expired"');
    expect(webhook).toContain('"payment_failed"');
    expect(webhook).toContain("stripe-${name}:${session.id}");
  });

  it("keeps hosted Checkout as the fallback and builds a separate Checkout Elements session for Google Pay", () => {
    const hosted = buildCheckoutSessionParams(analysis, "price_full", "https://cvunfold.com/raport", "hosted");
    const googlePay = buildCheckoutSessionParams(analysis, "price_full", "https://cvunfold.com/raport", "google_pay");

    expect(hosted.success_url).toContain("checkout=success");
    expect(hosted.cancel_url).toContain("checkout=cancelled");
    expect(hosted.integration_identifier).toMatch(/^cvunfold_hosted_[a-z]{8}$/);
    expect(hosted.metadata).toMatchObject({ analysis_id: analysis.id, checkout_surface: "hosted", buyer_confirmed: "true" });
    expect(hosted).not.toHaveProperty("managed_payments");

    expect(googlePay.ui_mode).toBe("elements");
    expect(googlePay.managed_payments).toEqual({ enabled: false });
    expect(googlePay.return_url).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(googlePay).not.toHaveProperty("success_url");
    expect(googlePay).not.toHaveProperty("cancel_url");
    expect(googlePay).not.toHaveProperty("payment_method_types");
    expect(googlePay.integration_identifier).toMatch(/^cvunfold_gpay_[a-z]{8}$/);
    expect(googlePay.metadata).toMatchObject({ analysis_id: analysis.id, checkout_surface: "google_pay", buyer_confirmed: "false" });
  });

  it("uses a new idempotency version after changing the Google Pay session parameters", () => {
    expect(checkoutIdempotencyKey(analysis.id, "price_full", "hosted")).toContain(":hosted:v1");
    expect(checkoutIdempotencyKey(analysis.id, "price_full", "google_pay")).toContain(":google_pay:v2");
  });

  it("does not count an eligibility-only Google Pay session as an abandoned checkout", () => {
    expect(shouldRecordCheckoutExpired({ metadata: { checkout_surface: "google_pay", buyer_confirmed: "false" } })).toBe(false);
    expect(shouldRecordCheckoutExpired({ metadata: { checkout_surface: "google_pay", buyer_confirmed: "true" } })).toBe(true);
    expect(shouldRecordCheckoutExpired({ metadata: { checkout_surface: "hosted", buyer_confirmed: "true" } })).toBe(true);
  });
});
