/**
 * Options for Stripe's Express Checkout Element.
 *
 * Stripe validates these at element creation and throws an IntegrationError on
 * an invalid combination, which leaves the element unmounted. Our own component
 * then treats "not mounted" as "no wallet on this device" and hides itself, so a
 * mistake here fails completely silently in every environment. Keep the
 * constraints below in sync with Stripe's validation.
 */
export const expressCheckoutOptions = {
  buttonHeight: 55,
  buttonTheme: { applePay: "black" as const, googlePay: "black" as const },
  buttonType: { applePay: "buy" as const, googlePay: "buy" as const },
  // One row of one column renders exactly one button; anything else Stripe
  // would show moves into the overflow instead of stacking a second wallet.
  // overflow must be "auto" here, because "never" is only valid with maxRows 0
  // (unlimited rows) — that combination is what made the element throw, and
  // unlimited rows is also what produced two stacked buttons once it loaded.
  layout: { maxColumns: 1, maxRows: 1, overflow: "auto" as const },
  // The Checkout-specific type requires the key even though Stripe documents
  // `undefined` as the way to keep its per-customer dynamic ordering.
  paymentMethodOrder: undefined,
  // "auto" offers a wallet only where the device actually supports it, so a
  // Chrome user is not shown Apple Pay and vice versa. "always" would advertise
  // both regardless, which is how two buttons appeared side by side.
  paymentMethods: {
    applePay: "auto" as const,
    googlePay: "auto" as const,
    amazonPay: "never" as const,
    klarna: "never" as const,
    link: "never" as const,
    paypal: "never" as const,
  },
};
