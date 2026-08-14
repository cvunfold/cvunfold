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

const rect = (top: number, bottom: number): DOMRect => ({
  x: 0, y: top, top, bottom, left: 0, right: 320, width: 320, height: bottom - top,
  toJSON: () => ({}),
});

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
  it("shows one mobile summary, promotes the full finding before scores and mounts the wallet once", () => {
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);

    const summary = container.querySelector(".report-mobile-summary");
    expect(summary?.textContent).toContain("Twój bezpłatny wynik");
    expect(summary?.textContent).toContain(`${teaser.counts.issues}`);
    expect(summary?.textContent).toContain("Odblokuj pełny raport");

    const finding = screen.getByRole("heading", { name: "Najważniejsze ustalenie darmowej analizy" }).closest("section");
    const categories = screen.getByRole("heading", { name: "Sygnały poziomu w kategoriach" }).closest("section");
    expect(finding).not.toBeNull();
    expect(categories).not.toBeNull();
    expect(Boolean(finding!.compareDocumentPosition(categories!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    const findingTags = finding!.querySelector(".finding-tags");
    const expectedSuggestion = teaser.featuredFinding?.suggestionType?.toUpperCase();
    if (!expectedSuggestion) throw new Error("Missing featured finding suggestion type");
    expect(findingTags?.children).toHaveLength(2);
    expect(findingTags?.textContent).toContain("critical");
    expect(findingTags?.textContent).toContain(expectedSuggestion);
    expect(screen.getAllByTestId("express-wallet-stub")).toHaveLength(1);
    const paymentMethods = container.querySelector(".payment-methods-list");
    expect(paymentMethods?.textContent).toContain("Obsługiwane płatności");
    for (const method of ["Karta", "BLIK", "Apple Pay", "Google Pay"]) expect(paymentMethods?.textContent).toContain(method);
  });

  it("shows the sticky CTA only between the mobile summary and the final paywall", () => {
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);
    const summaryButton = container.querySelector<HTMLButtonElement>('[data-purchase-surface="mobile_summary"]')!;
    const paywall = container.querySelector<HTMLElement>(".locked")!;
    const sticky = container.querySelector<HTMLButtonElement>(".report-mobile-sticky-cta")!;

    summaryButton.getBoundingClientRect = () => rect(-70, -10);
    paywall.getBoundingClientRect = () => rect(1400, 1700);
    act(() => { IntersectionObserverStub.instances.forEach((observer) => observer.trigger(summaryButton, false)); });
    expect(sticky.dataset.visible).toBe("true");
    expect(sticky.getAttribute("aria-hidden")).toBe("false");
    expect(analytics).toHaveBeenCalledWith("unlock_cta_viewed", expect.objectContaining({
      purchase_surface: "mobile_sticky",
      payment_method: "standard",
    }));

    paywall.getBoundingClientRect = () => rect(500, 800);
    act(() => { IntersectionObserverStub.instances.forEach((observer) => observer.trigger(paywall)); });
    expect(sticky.dataset.visible).toBe("false");
    expect(sticky.getAttribute("aria-hidden")).toBe("true");
  });

  it("tracks the standard purchase surface without report or CV data", () => {
    const teaser = toTeaser(createMockReport());
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    const { container } = render(<ReportView paid={false} data={teaser} mockMode locale="pl"/>);
    const summaryButton = container.querySelector<HTMLButtonElement>('[data-purchase-surface="mobile_summary"]')!;

    fireEvent.click(summaryButton);
    expect(analytics).toHaveBeenCalledWith("unlock_cta_clicked", expect.objectContaining({
      purchase_surface: "mobile_summary",
      payment_method: "standard",
    }));
    expect(JSON.stringify(analytics.mock.calls)).not.toContain(teaser.featuredFinding?.evidence);
  });
});
