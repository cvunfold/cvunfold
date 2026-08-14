"use client";

import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckoutElementsProvider, ExpressCheckoutElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { loadStripe, type StripeExpressCheckoutElementConfirmEvent, type StripeExpressCheckoutElementReadyEvent } from "@stripe/stripe-js";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { MeasurementContext } from "@/lib/audience";
import { reportPath, type Locale } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey && /^pk_(test|live)_/.test(publishableKey) ? loadStripe(publishableKey) : null;

const expressCheckoutOptions = {
  buttonHeight: 55,
  buttonTheme: { googlePay: "black" as const },
  buttonType: { googlePay: "buy" as const },
  layout: { maxColumns: 1, maxRows: 1, overflow: "never" as const },
  paymentMethodOrder: ["googlePay"],
  paymentMethods: {
    googlePay: "auto" as const,
    amazonPay: "never" as const,
    applePay: "never" as const,
    klarna: "never" as const,
    link: "never" as const,
    paypal: "never" as const,
  },
};

type Props = {
  enabled: boolean;
  locale: Locale;
  plan: Plan;
  measurementContext: MeasurementContext;
  onAvailabilityChange: (available: boolean) => void;
};

class GooglePayErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function GooglePayElement({ locale, plan, measurementContext, onAvailabilityChange }: Omit<Props, "enabled">) {
  const checkoutState = useCheckoutElements();
  const [available, setAvailable] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const genericError = locale === "pl"
    ? "Nie udało się uruchomić Google Pay. Użyj zwykłego przycisku płatności."
    : "We could not start Google Pay. Use the standard payment button.";

  useEffect(() => {
    if (checkoutState.type === "error") onAvailabilityChange(false);
  }, [checkoutState.type, onAvailabilityChange]);

  if (checkoutState.type !== "success") return null;
  const { checkout } = checkoutState;

  function handleReady(event: StripeExpressCheckoutElementReadyEvent) {
    const googlePayAvailable = event.availablePaymentMethods?.googlePay === true;
    setAvailable(googlePayAvailable);
    onAvailabilityChange(googlePayAvailable);
  }

  async function handleConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    setPaymentError(null);
    const started = await fetch("/api/report/checkout/google-pay/started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: checkout.id }),
    }).catch(() => null);
    if (!started?.ok) {
      setPaymentError(genericError);
      return;
    }

    trackAnalyticsEvent("checkout_started", { plan, locale, market: locale, ...measurementContext });
    const result = await checkout.confirm({ expressCheckoutConfirmEvent: event, redirect: "if_required" });
    if (result.type === "error") {
      setPaymentError(result.error.message || genericError);
      return;
    }
    window.location.assign(`${reportPath(locale)}?checkout=success&session_id=${encodeURIComponent(result.session.id)}`);
  }

  return <div className={`google-pay-cta${available ? " is-ready" : ""}`} aria-hidden={!available}>
    <ExpressCheckoutElement
      options={expressCheckoutOptions}
      onReady={handleReady}
      onConfirm={handleConfirm}
      onCancel={() => setPaymentError(null)}
      onLoadError={() => { setAvailable(false); onAvailabilityChange(false); }}
    />
    {paymentError ? <p className="google-pay-error" role="alert">{paymentError}</p> : null}
  </div>;
}

export function GooglePayCheckout({ enabled, locale, plan, measurementContext, onAvailabilityChange }: Props) {
  const clientSecret = useMemo(() => {
    if (!enabled || !stripePromise) return null;
    return fetch("/api/report/checkout/google-pay", { method: "POST" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { clientSecret?: unknown };
        if (!response.ok || typeof body.clientSecret !== "string") throw new Error("GOOGLE_PAY_CHECKOUT_UNAVAILABLE");
        return body.clientSecret;
      });
  }, [enabled]);

  useEffect(() => {
    if (!clientSecret) onAvailabilityChange(false);
  }, [clientSecret, onAvailabilityChange]);

  if (!stripePromise || !clientSecret) return null;
  return <GooglePayErrorBoundary onError={() => onAvailabilityChange(false)}>
    <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
      <GooglePayElement
        locale={locale}
        plan={plan}
        measurementContext={measurementContext}
        onAvailabilityChange={onAvailabilityChange}
      />
    </CheckoutElementsProvider>
  </GooglePayErrorBoundary>;
}
