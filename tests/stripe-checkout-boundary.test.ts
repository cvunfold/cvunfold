import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Analysis } from "@/lib/data/store";

const mocks = vi.hoisted(() => ({ price: vi.fn(), create: vi.fn(), retrieve: vi.fn(), saved: vi.fn(), fulfilled: vi.fn(), constructor: vi.fn() }));
vi.mock("stripe", () => ({ default: class {
  prices = { retrieve: mocks.price };
  checkout = { sessions: { create: mocks.create, retrieve: mocks.retrieve } };
  constructor(...args: unknown[]) { mocks.constructor(...args); }
} }));
vi.mock("@/lib/data/store", () => ({ getReportRevisions: async () => [], savePendingPayment: mocks.saved, fulfillStripePayment: mocks.fulfilled }));
const analysis = { id: "qa-report", plan: "full_review", locale: "pl", market: "pl" } as Analysis;

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL_TARGET_ENV", "preview");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture"); vi.stubEnv("STRIPE_PRICE_FULL_REVIEW", "price_test_full");
  mocks.price.mockResolvedValue({ id: "price_test_full", active: true, livemode: false, recurring: null, unit_amount: 5900, currency: "pln", tax_behavior: "inclusive", product: { id: "prod_test_full", active: true } });
  mocks.create.mockResolvedValue({ id: "cs_test_full", url: "https://checkout.stripe.com/fixture", amount_total: 5900, currency: "pln", livemode: false });
});
afterEach(() => vi.unstubAllEnvs());

it("blocks a live key in Preview before creating a Stripe client", async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fixture");
  const { createCheckout } = await import("@/lib/payments/stripe");
  await expect(createCheckout(analysis, "https://qa.cvunfold.example")).rejects.toThrow("STRIPE_ENVIRONMENT_MISMATCH");
  expect(mocks.constructor).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
});
it("creates the PLN checkout for the active gross price and records a test payment", async () => {
  const { createCheckout } = await import("@/lib/payments/stripe");
  await expect(createCheckout(analysis, "https://qa.cvunfold.example")).resolves.toBe("https://checkout.stripe.com/fixture");
  expect(mocks.price).toHaveBeenCalledWith("price_test_full", { expand: ["product"] });
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment", line_items: [{ price: "price_test_full", quantity: 1 }], success_url: expect.stringContaining("https://qa.cvunfold.example/raport/qa-report") }), expect.any(Object));
  expect(mocks.saved).toHaveBeenCalledWith(expect.objectContaining({ amountGross: 5900, livemode: false }));
});
it.each([
  ["wrong amount", { unit_amount: 2900 }],
  ["recurring price", { recurring: { interval: "month" } }],
  ["exclusive tax", { tax_behavior: "exclusive" }],
  ["inactive product", { product: { id: "prod_test_full", active: false } }],
])("rejects %s before opening checkout", async (_label, overrides) => {
  const price = await mocks.price(); mocks.price.mockResolvedValue({ ...price, ...overrides });
  const { createCheckout } = await import("@/lib/payments/stripe");
  await expect(createCheckout(analysis, "https://qa.cvunfold.example")).rejects.toThrow("STRIPE_PRICE_MISMATCH");
  expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.saved).not.toHaveBeenCalled();
});
it("does not record a session whose total differs from the published price", async () => {
  mocks.create.mockResolvedValue({ id: "cs_test_bad_total", url: "https://checkout.stripe.com/fixture", amount_total: 6000, currency: "pln", livemode: false });
  const { createCheckout } = await import("@/lib/payments/stripe");
  await expect(createCheckout(analysis, "https://qa.cvunfold.example")).rejects.toThrow("STRIPE_CHECKOUT_MISMATCH");
  expect(mocks.saved).not.toHaveBeenCalled();
});
it("keeps retired job matching unavailable for new purchases", async () => {
  const { createCheckout } = await import("@/lib/payments/stripe");
  await expect(createCheckout({ ...analysis, plan: "job_match" }, "https://qa.cvunfold.example")).rejects.toThrow("PLAN_NOT_AVAILABLE");
  expect(mocks.constructor).not.toHaveBeenCalled();
});
it("does not fulfill an unpaid session even with a success redirect", async () => {
  mocks.retrieve.mockResolvedValue({ id: "cs_test_unpaid", livemode: false, payment_status: "unpaid" });
  const { fulfillCheckoutSession } = await import("@/lib/payments/stripe");
  await expect(fulfillCheckoutSession("cs_test_unpaid", "evt_test_unpaid")).resolves.toBe(false);
  expect(mocks.fulfilled).not.toHaveBeenCalled();
});
