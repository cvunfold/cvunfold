// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GooglePayCheckout } from "@/components/google-pay-checkout";
import { DEFAULT_MEASUREMENT_CONTEXT } from "@/lib/audience";

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_google_pay_fixture";
  return {
    analytics: vi.fn(),
    confirm: vi.fn().mockResolvedValue({ type: "error", error: { message: "Payment declined" } }),
    expressCheckoutOptions: null as Record<string, unknown> | null,
    expressCheckoutShouldThrow: false,
    googlePayAvailable: true,
    googlePayAvailableAfterReady: null as boolean | null,
  };
});

vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({} as never)) }));
vi.mock("@stripe/react-stripe-js/checkout", async () => {
  const ReactModule = await vi.importActual<typeof import("react")>("react");
  return {
    CheckoutElementsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCheckoutElements: () => ({ type: "success", checkout: { id: "cs_test_google_pay", confirm: mocks.confirm } }),
    ExpressCheckoutElement: ({ options, onReady, onAvailablePaymentMethodsChange, onConfirm, onCancel }: { options: Record<string, unknown>; onReady: (event: unknown) => void; onAvailablePaymentMethodsChange?: (event: unknown) => void; onConfirm: (event: unknown) => void; onCancel?: (event: unknown) => void }) => {
      mocks.expressCheckoutOptions = options;
      ReactModule.useEffect(() => {
        if (!mocks.expressCheckoutShouldThrow) {
          onReady({ elementType: "expressCheckout", availablePaymentMethods: { googlePay: mocks.googlePayAvailable } });
          if (mocks.googlePayAvailableAfterReady !== null) {
            onAvailablePaymentMethodsChange?.({
              elementType: "expressCheckout",
              paymentMethods: { googlePay: { available: mocks.googlePayAvailableAfterReady } },
            });
          }
        }
      }, []);
      if (mocks.expressCheckoutShouldThrow) throw new Error("invalid express checkout options");
      return <><button onClick={() => onConfirm({ elementType: "expressCheckout" })}>Google Pay test button</button><button onClick={() => onCancel?.({ elementType: "expressCheckout" })}>Cancel Google Pay test</button></>;
    },
  };
});
vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent: mocks.analytics }));

const fetchMock = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith("/started")) return Promise.resolve({ ok: true } as Response);
  return Promise.resolve({ ok: true, json: async () => ({ clientSecret: "cs_test_secret_fixture" }) } as Response);
});

function exposeVisibleIntersectionObserver() {
  class VisibleIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [.5];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe = (target: Element) => this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = () => [];
  }
  vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);
}

afterEach(() => {
  cleanup();
  fetchMock.mockClear();
  mocks.analytics.mockClear();
  mocks.confirm.mockClear();
  mocks.expressCheckoutOptions = null;
  mocks.expressCheckoutShouldThrow = false;
  mocks.googlePayAvailable = true;
  mocks.googlePayAvailableAfterReady = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Google Pay checkout CTA", () => {
  it("reveals the official wallet slot when Stripe reports Google Pay after the initial ready event", async () => {
    vi.stubGlobal("fetch", fetchMock);
    exposeVisibleIntersectionObserver();
    mocks.googlePayAvailable = false;
    mocks.googlePayAvailableAfterReady = true;
    const onAvailabilityChange = vi.fn();
    render(<GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} purchaseSurface="report_paywall" onAvailabilityChange={onAvailabilityChange}/>);

    const button = await screen.findByRole("button", { name: "Google Pay test button" });
    expect(mocks.expressCheckoutOptions).toMatchObject({
      buttonHeight: 55,
      paymentMethods: { googlePay: "always" },
    });
    expect(onAvailabilityChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(mocks.analytics).toHaveBeenCalledWith("unlock_cta_viewed", expect.objectContaining({ purchase_surface: "report_paywall", payment_method: "google_pay" })));
    fireEvent.click(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/report/checkout/google-pay/started", expect.objectContaining({ method: "POST" })));
    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.analytics).toHaveBeenCalledWith("unlock_cta_clicked", expect.objectContaining({ purchase_surface: "report_paywall", payment_method: "google_pay" }));
    expect(mocks.analytics).toHaveBeenCalledWith("checkout_started", expect.objectContaining({ plan: "full_review", locale: "pl" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Payment declined");
  });

  it("does not expose a fake Google Pay button when Stripe reports no eligible wallet", async () => {
    vi.stubGlobal("fetch", fetchMock);
    mocks.googlePayAvailable = false;
    const onAvailabilityChange = vi.fn();
    render(<GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} purchaseSurface="report_paywall" onAvailabilityChange={onAvailabilityChange}/>);

    await waitFor(() => expect(onAvailabilityChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("button", { name: "Google Pay test button" })).toBeNull();
  });

  it("keeps the fallback usable and does not start checkout when the wallet is cancelled", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const onAvailabilityChange = vi.fn();
    render(<><span>Standard checkout remains</span><GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} purchaseSurface="report_paywall" onAvailabilityChange={onAvailabilityChange}/></>);

    fireEvent.click(await screen.findByRole("button", { name: "Cancel Google Pay test" }));

    expect(screen.getByText("Standard checkout remains")).toBeTruthy();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/report/checkout/google-pay/started", expect.anything());
    expect(mocks.analytics).not.toHaveBeenCalledWith("checkout_started", expect.anything());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the standard checkout surface alive when Stripe rejects the wallet element", async () => {
    vi.stubGlobal("fetch", fetchMock);
    mocks.expressCheckoutShouldThrow = true;
    const onAvailabilityChange = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<><span>Standard checkout remains</span><GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} purchaseSurface="report_paywall" onAvailabilityChange={onAvailabilityChange}/></>);

    await waitFor(() => expect(onAvailabilityChange).toHaveBeenCalledWith(false));
    expect(screen.getByText("Standard checkout remains")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Google Pay test button" })).toBeNull();
    consoleError.mockRestore();
  });
});
