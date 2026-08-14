"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckoutElementsProvider, ExpressCheckoutElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import {
  loadStripe,
  type StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { MeasurementContext } from "@/lib/audience";
import type { PurchaseSurface } from "@/lib/analytics/events";
import { reportPath, type Locale } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey && /^pk_(test|live)_/.test(publishableKey) ? loadStripe(publishableKey) : null;

const expressCheckoutOptions = {
  buttonHeight: 55,
  buttonTheme: { applePay: "black" as const, googlePay: "black" as const },
  buttonType: { applePay: "buy" as const, googlePay: "buy" as const },
  layout: { maxColumns: 1, maxRows: 1, overflow: "never" as const },
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

type Props = {
  enabled: boolean;
  locale: Locale;
  plan: Plan;
  measurementContext: MeasurementContext;
  purchaseSurface: PurchaseSurface;
  onAvailabilityChange: (available: boolean) => void;
};

class ExpressWalletErrorBoundary extends Component<
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

function ExpressWalletElement({ locale, plan, measurementContext, purchaseSurface, onAvailabilityChange }: Omit<Props, "enabled">) {
  const checkoutState = useCheckoutElements();
  const [available, setAvailable] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const genericError = locale === "pl"
    ? "Nie udało się uruchomić szybkiej płatności. Użyj zwykłego przycisku płatności."
    : "We could not start the wallet. Use the standard payment button.";

  useEffect(() => {
    if (checkoutState.type === "error") onAvailabilityChange(false);
  }, [checkoutState.type, onAvailabilityChange]);

  useEffect(() => {
    if (!available || viewTracked.current || !container.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || viewTracked.current) return;
      viewTracked.current = true;
      trackAnalyticsEvent("unlock_cta_viewed", {
        plan, locale, market: locale, purchase_surface: purchaseSurface, payment_method: "express_wallet", ...measurementContext,
      });
      observer.disconnect();
    }, { threshold: .5 });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [available, locale, measurementContext, plan, purchaseSurface]);

  if (checkoutState.type !== "success") return null;
  const { checkout } = checkoutState;

  function updateWalletAvailability(walletAvailable: boolean) {
    setAvailable(walletAvailable);
    onAvailabilityChange(walletAvailable);
  }

  function handleReady(event: StripeExpressCheckoutElementReadyEvent) {
    updateWalletAvailability(event.availablePaymentMethods?.applePay === true || event.availablePaymentMethods?.googlePay === true);
  }

  function handleAvailablePaymentMethodsChange(event: StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent) {
    updateWalletAvailability(event.paymentMethods?.applePay?.available === true || event.paymentMethods?.googlePay?.available === true);
  }

  async function handleConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    setPaymentError(null);
    const paymentMethod = event.expressPaymentType;
    if (paymentMethod !== "apple_pay" && paymentMethod !== "google_pay") {
      event.paymentFailed({ reason: "fail" });
      setPaymentError(genericError);
      return;
    }
    trackAnalyticsEvent("unlock_cta_clicked", {
      plan, locale, market: locale, purchase_surface: purchaseSurface, payment_method: paymentMethod, ...measurementContext,
    });
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

  return <div ref={container} className={`express-wallet-cta${available ? " is-ready" : ""}`} aria-hidden={!available}>
    <ExpressCheckoutElement
      options={expressCheckoutOptions}
      onReady={handleReady}
      onAvailablePaymentMethodsChange={handleAvailablePaymentMethodsChange}
      onConfirm={handleConfirm}
      onCancel={() => setPaymentError(null)}
      onLoadError={() => { setAvailable(false); onAvailabilityChange(false); }}
    />
    {paymentError ? <p className="express-wallet-error" role="alert">{paymentError}</p> : null}
  </div>;
}

export function ExpressWalletCheckout({ enabled, locale, plan, measurementContext, purchaseSurface, onAvailabilityChange }: Props) {
  const clientSecret = useMemo(() => {
    if (!enabled || !stripePromise) return null;
    return fetch("/api/report/checkout/google-pay", { method: "POST" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { clientSecret?: unknown };
        if (!response.ok || typeof body.clientSecret !== "string") throw new Error("EXPRESS_WALLET_CHECKOUT_UNAVAILABLE");
        return body.clientSecret;
      });
  }, [enabled]);

  useEffect(() => {
    if (!clientSecret) onAvailabilityChange(false);
  }, [clientSecret, onAvailabilityChange]);

  if (!stripePromise || !clientSecret) return null;
  return <ExpressWalletErrorBoundary onError={() => onAvailabilityChange(false)}>
    <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
      <ExpressWalletElement
        locale={locale}
        plan={plan}
        measurementContext={measurementContext}
        purchaseSurface={purchaseSurface}
        onAvailabilityChange={onAvailabilityChange}
      />
    </CheckoutElementsProvider>
  </ExpressWalletErrorBoundary>;
}
