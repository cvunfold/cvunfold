import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  fulfillCheckoutSession: vi.fn(),
  markStripePaymentTerminal: vi.fn(),
  listSessions: vi.fn(),
  track: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({
  fulfillCheckoutSession: mocks.fulfillCheckoutSession,
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    checkout: { sessions: { list: mocks.listSessions } },
  }),
}));

vi.mock("@/lib/data/store", () => ({
  markStripePaymentTerminal: mocks.markStripePaymentTerminal,
  track: mocks.track,
}));

import { POST } from "@/app/api/stripe/webhook/route";

function request(): Request {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "valid-signature" },
    body: "signed-body",
  });
}

describe("Stripe webhook boundary", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_cvunfold_test";
    mocks.constructEvent.mockReset();
    mocks.fulfillCheckoutSession.mockReset();
    mocks.markStripePaymentTerminal.mockReset();
    mocks.listSessions.mockReset();
    mocks.track.mockReset();
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("fails closed when the webhook secret is absent", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect((await POST(request())).status).toBe(503);
    expect(mocks.constructEvent).not.toHaveBeenCalled();
  });

  it("rejects an invalid Stripe signature", async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error("invalid signature"); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("fulfills a completed Checkout Session and remains safe on duplicate delivery", async () => {
    const session = { id: "cs_test_cvunfold" };
    mocks.constructEvent.mockReturnValue({ id: "evt_test_1", type: "checkout.session.completed", data: { object: session } });
    mocks.fulfillCheckoutSession.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect((await POST(request())).status).toBe(200);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.fulfillCheckoutSession).toHaveBeenNthCalledWith(1, session.id, "evt_test_1");
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });

  it("marks delayed-payment failure as terminal", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_test_fail", type: "checkout.session.async_payment_failed", data: { object: { id: "cs_test_fail" } } });
    mocks.markStripePaymentTerminal.mockResolvedValue(true);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.markStripePaymentTerminal).toHaveBeenCalledWith("evt_test_fail", "cs_test_fail", "failed");
  });

  it("maps a refund back to its Checkout Session", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_test_refund", type: "charge.refunded", data: { object: { payment_intent: "pi_test_refund" } } });
    mocks.listSessions.mockResolvedValue({ data: [{ id: "cs_test_refund" }] });
    mocks.markStripePaymentTerminal.mockResolvedValue(true);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.markStripePaymentTerminal).toHaveBeenCalledWith("evt_test_refund", "cs_test_refund", "refunded");
  });
});
