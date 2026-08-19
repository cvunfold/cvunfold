import { describe, expect, it } from "vitest";
import { expressCheckoutOptions } from "@/lib/payments/express-checkout-options";

// A live production report threw:
//   IntegrationError: options.layout.overflow: 'never' is only supported when
//   options.layout.maxRows is 0. Use overflow: 'auto' instead.
// The element never mounted, so the wallet button was invisible everywhere,
// with no server-side symptom at all. Fixed by using the "auto" overflow
// Stripe's own error message recommends, paired with a one-row layout.
//
// Once it did mount, "always" on both wallets rendered Apple Pay and Google
// Pay side by side regardless of the device, which read as a layout bug
// rather than two real payment options. "auto" shows only what a given
// browser actually supports, so a Chrome/Google Pay user never sees a
// second, non-functional Apple Pay button.
describe("Express Checkout Element options", () => {
  it("uses the maxRows/overflow pairing Stripe's own error message recommends", () => {
    expect(expressCheckoutOptions.layout).toMatchObject({ maxColumns: 1, maxRows: 1, overflow: "auto" });
  });

  it("shows a wallet only where the browser actually supports it, never unconditionally", () => {
    expect(expressCheckoutOptions.paymentMethods.googlePay).toBe("auto");
    expect(expressCheckoutOptions.paymentMethods.applePay).toBe("auto");
  });
});
