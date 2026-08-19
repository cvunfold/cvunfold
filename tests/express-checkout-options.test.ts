import { describe, expect, it } from "vitest";
import { expressCheckoutOptions } from "@/lib/payments/express-checkout-options";

// A live production report threw:
//   IntegrationError: options.layout.overflow: 'never' is only supported when
//   options.layout.maxRows is 0. Use overflow: 'auto' instead.
// The element never mounted, so the wallet button was invisible everywhere,
// with no server-side symptom at all.
describe("Express Checkout Element options", () => {
  it("does not combine overflow 'never' with a row limit Stripe rejects", () => {
    const { overflow, maxRows } = expressCheckoutOptions.layout;
    if (overflow === "never") expect(maxRows).toBe(0);
  });

  it("keeps both wallets requestable", () => {
    expect(expressCheckoutOptions.paymentMethods.googlePay).toBe("always");
    expect(expressCheckoutOptions.paymentMethods.applePay).toBe("always");
  });
});
