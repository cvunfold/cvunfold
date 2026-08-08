import { afterEach, describe, expect, it } from "vitest";
import { priceForPlan } from "@/lib/payments/stripe";

const originalFullPrice = process.env.STRIPE_PRICE_FULL_REVIEW;
const originalJobPrice = process.env.STRIPE_PRICE_JOB_MATCH;

afterEach(() => {
  if (originalFullPrice === undefined) delete process.env.STRIPE_PRICE_FULL_REVIEW;
  else process.env.STRIPE_PRICE_FULL_REVIEW = originalFullPrice;
  if (originalJobPrice === undefined) delete process.env.STRIPE_PRICE_JOB_MATCH;
  else process.env.STRIPE_PRICE_JOB_MATCH = originalJobPrice;
});

describe("Stripe price boundary", () => {
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
});
