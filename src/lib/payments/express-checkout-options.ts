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
  // overflow "never" is only valid with maxRows 0 (unlimited rows). Pairing it
  // with maxRows 1 is what Stripe rejects. A device realistically offers one
  // wallet at a time, so unlimited rows still renders a single button.
  layout: { maxColumns: 1, maxRows: 0, overflow: "never" as const },
  // The Checkout-specific type requires the key even though Stripe documents
  // `undefined` as the way to keep its per-customer dynamic ordering.
  paymentMethodOrder: undefined,
  paymentMethods: {
    applePay: "always" as const,
    googlePay: "always" as const,
    amazonPay: "never" as const,
    klarna: "never" as const,
    link: "never" as const,
    paypal: "never" as const,
  },
};
