// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportView } from "@/components/report-view";
import { createMockReport } from "@/lib/ai/mock-report";
import { toTeaser } from "@/lib/ai/validate-report";

const { analytics } = vi.hoisted(() => ({ analytics: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent: analytics, trackPurchaseConversion: vi.fn() }));
vi.mock("next/dynamic", () => ({
  default: () => function ExpressWalletStub({ purchaseSurface }: { purchaseSurface: string }) {
    return <div data-testid="express-wallet-stub" data-surface={purchaseSurface}/>;
  },
}));

class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  private readonly callback: IntersectionObserverCallback;
  readonly observed = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe = (target: Element) => { this.observed.add(target); };
  unobserve = (target: Element) => { this.observed.delete(target); };
  disconnect = () => { this.observed.clear(); };
  takeRecords = () => [];
  trigger(target: Element, isIntersecting = true) {
    this.callback([{ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  IntersectionObserverStub.instances = [];
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true,
    media: "(max-width: 720px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  analytics.mockClear();
  vi.unstubAllGlobals();
});

describe("free report purchase hierarchy", () => {
  it("shows one privacy-safe hook before the payment offer and mounts the wallet once", () => {
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);

    const hook = screen.getByRole("heading", { name: "Wykryliśmy problem, który może osłabiać odbiór Twojego CV." }).closest("section");
    const paywall = container.querySelector<HTMLElement>(".locked");
    expect(hook?.textContent).toContain(teaser.hook);
    expect(hook?.textContent).toContain("Zobacz, gdzie to występuje, jak wpływa na odbiór i co zmienić.");
    expect(paywall).not.toBeNull();
    expect(Boolean(hook!.compareDocumentPosition(paywall!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(container.textContent).not.toContain("Efekty pracy giną pod listą obowiązków");
    expect(container.textContent).not.toContain("Najmocniejsze doświadczenie jest opisane jako wykonywane czynności");
    expect(screen.getAllByTestId("express-wallet-stub")).toHaveLength(1);
    const paymentMethods = container.querySelector(".payment-methods-list");
    expect(paymentMethods?.textContent).toContain("Obsługiwane płatności");
    for (const method of ["Karta", "BLIK", "Apple Pay", "Google Pay"]) expect(paymentMethods?.textContent).toContain(method);
  });

  it("tracks the paywall CTA after the hook", () => {
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);
    const paywallButton = container.querySelector<HTMLButtonElement>('[data-purchase-surface="report_paywall"]')!;
    act(() => { IntersectionObserverStub.instances.forEach((observer) => observer.trigger(paywallButton)); });
    expect(analytics).toHaveBeenCalledWith("unlock_cta_viewed", expect.objectContaining({
      purchase_surface: "report_paywall",
      payment_method: "standard",
    }));
  });

  it("tracks the standard purchase surface without report or CV data", () => {
    const teaser = toTeaser(createMockReport());
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    const { container } = render(<ReportView paid={false} data={teaser} mockMode locale="pl"/>);
    const paywallButton = container.querySelector<HTMLButtonElement>('[data-purchase-surface="report_paywall"]')!;

    fireEvent.click(paywallButton);
    expect(analytics).toHaveBeenCalledWith("unlock_cta_clicked", expect.objectContaining({
      purchase_surface: "report_paywall",
      payment_method: "standard",
    }));
    expect(JSON.stringify(analytics.mock.calls)).not.toContain(teaser.hook);
  });
});
