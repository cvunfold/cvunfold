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
    googlePayAvailable: true,
  };
});

vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({} as never)) }));
vi.mock("@stripe/react-stripe-js/checkout", async () => {
  const ReactModule = await vi.importActual<typeof import("react")>("react");
  return {
    CheckoutElementsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCheckoutElements: () => ({ type: "success", checkout: { id: "cs_test_google_pay", confirm: mocks.confirm } }),
    ExpressCheckoutElement: ({ onReady, onConfirm }: { onReady: (event: unknown) => void; onConfirm: (event: unknown) => void }) => {
      ReactModule.useEffect(() => {
        onReady({ elementType: "expressCheckout", availablePaymentMethods: { googlePay: mocks.googlePayAvailable } });
      }, []);
      return <button onClick={() => onConfirm({ elementType: "expressCheckout" })}>Google Pay test button</button>;
    },
  };
});
vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent: mocks.analytics }));

const fetchMock = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith("/started")) return Promise.resolve({ ok: true } as Response);
  return Promise.resolve({ ok: true, json: async () => ({ clientSecret: "cs_test_secret_fixture" }) } as Response);
});

afterEach(() => {
  cleanup();
  fetchMock.mockClear();
  mocks.analytics.mockClear();
  mocks.confirm.mockClear();
  mocks.googlePayAvailable = true;
  vi.unstubAllGlobals();
});

describe("Google Pay checkout CTA", () => {
  it("reveals the official wallet slot only when Google Pay is available and keeps server-side start tracking", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const onAvailabilityChange = vi.fn();
    render(<GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} onAvailabilityChange={onAvailabilityChange}/>);

    const button = await screen.findByRole("button", { name: "Google Pay test button" });
    expect(onAvailabilityChange).toHaveBeenCalledWith(true);
    fireEvent.click(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/report/checkout/google-pay/started", expect.objectContaining({ method: "POST" })));
    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.analytics).toHaveBeenCalledWith("checkout_started", expect.objectContaining({ plan: "full_review", locale: "pl" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Payment declined");
  });

  it("does not expose a fake Google Pay button when Stripe reports no eligible wallet", async () => {
    vi.stubGlobal("fetch", fetchMock);
    mocks.googlePayAvailable = false;
    const onAvailabilityChange = vi.fn();
    render(<GooglePayCheckout enabled locale="pl" plan="full_review" measurementContext={DEFAULT_MEASUREMENT_CONTEXT} onAvailabilityChange={onAvailabilityChange}/>);

    await waitFor(() => expect(onAvailabilityChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("button", { name: "Google Pay test button" })).toBeNull();
  });
});
