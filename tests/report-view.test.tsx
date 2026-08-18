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
  it("shows one evidence-backed issue before the payment offer and mounts the wallet once", () => {
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);

    const hook = screen.getByRole("heading", { name: "Wykryliśmy 3 problemy, które mogą osłabiać odbiór Twojego CV." }).closest("section");
    const paywall = container.querySelector<HTMLElement>(".locked");
    expect(container.querySelector(".teaser-profile")?.textContent).toContain(teaser.profileSummary);
    expect(container.querySelector(".teaser-first-impression")?.textContent).toContain(teaser.firstImpression);
    expect(hook?.textContent).toContain(teaser.featuredIssue?.title);
    expect(hook?.textContent).toContain(teaser.featuredIssue?.evidence);
    expect(hook?.textContent).toContain(teaser.featuredIssue?.actionDirection);
    expect(hook?.textContent).toContain("1 istotny · 1 umiarkowany · 1 drobny");
    expect(paywall).not.toBeNull();
    expect(Boolean(hook!.compareDocumentPosition(paywall!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(container.textContent).toContain("Najmocniejsze doświadczenie jest opisane jako wykonywane czynności");
    expect(container.textContent).not.toContain("Zakres ownershipu jest niejasny");
    expect(screen.getAllByTestId("express-wallet-stub")).toHaveLength(1);
    const paymentMethods = container.querySelector(".payment-methods-list");
    expect(paymentMethods?.textContent).toContain("Obsługiwane płatności");
    for (const method of ["Karta", "BLIK", "Apple Pay", "Google Pay"]) expect(paymentMethods?.textContent).toContain(method);
  });

  it("shows every severity count with correct Polish inflection", () => {
    const teaser = { ...toTeaser(createMockReport()), issueCount: 5, severityCounts: { critical: 1, important: 3, minor: 1 } };
    render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);
    expect(screen.getByRole("heading", { name: "Wykryliśmy 5 problemów, które mogą osłabiać odbiór Twojego CV." })).toBeTruthy();
    expect(screen.getByText("1 istotny · 3 umiarkowane · 1 drobny")).toBeTruthy();
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
    expect(JSON.stringify(analytics.mock.calls)).not.toContain("Zakres ownershipu jest niejasny");
  });
});

describe("ATS presentation", () => {
  it("keeps ATS out of the seniority category list and shows it as separate hygiene", () => {
    const report = createMockReport();
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);

    const categoryLabels = [...container.querySelectorAll(".score-rows > div > b")].map((node) => node.textContent);
    expect(categoryLabels.length).toBe(report.categoryScores.length - 1);
    expect(categoryLabels.some((label) => label?.includes("ATS"))).toBe(false);

    const panel = container.querySelector(".ats-panel");
    expect(panel).not.toBeNull();
    const atsCategory = report.categoryScores.find((category) => category.key === "ats");
    expect(panel?.textContent).toContain(String(atsCategory?.score));
    // The separation only means something if it says what ATS is not.
    expect(panel?.textContent).toContain("To nie jest ocena treści ani poziomu.");
  });

  it("surfaces the ATS findings the model already produced", () => {
    const report = createMockReport();
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    const findings = container.querySelectorAll(".ats-findings li");
    expect(findings.length).toBe(report.ats.findings.length);
  });
});

describe("report header", () => {
  it("states the selected target level instead of repeating the perceived one", () => {
    const report = createMockReport("senior");
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);

    const heading = container.querySelector(".report-title h2");
    // perceivedRole already carries the level; the suffix was a third repetition.
    expect(heading?.textContent).toBe(report.document.perceivedRole);
    expect(container.querySelector(".report-target")?.textContent).toBe("Aplikuje na poziom: Senior");
  });

  it("says the level was inferred when no target was chosen", () => {
    const report = createMockReport("auto");
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    expect(container.querySelector(".report-target")?.textContent).toBe("Poziom wykrywany z treści CV");
  });
});
