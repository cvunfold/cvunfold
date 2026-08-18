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
    expect(hook?.textContent).toContain("1 kluczowy · 1 istotny · 1 drobny");
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
    expect(screen.getByText("1 kluczowy · 3 istotne · 1 drobny")).toBeTruthy();
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
    expect(categoryLabels.length).toBe(report.categoryScores.length);
    expect(categoryLabels.some((label) => label?.includes("ATS"))).toBe(false);

    const panel = container.querySelector(".ats-panel");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain(String(report.ats?.score));
    // The separation only means something if it says what ATS is not.
    expect(panel?.textContent).toContain("To nie jest ocena treści ani poziomu.");
  });

  it("collapses the ATS checklist to a 3-item preview, expandable to the full list", () => {
    const report = createMockReport();
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    const applicableChecks = report.ats?.checks.filter((check) => check.status !== "not_applicable") || [];
    expect(container.querySelectorAll(".ats-findings li").length).toBe(3);

    fireEvent.click(screen.getByText("Pokaż wszystkie kontrole"));
    expect(container.querySelectorAll(".ats-findings li").length).toBe(applicableChecks.length);

    fireEvent.click(screen.getByText("Zwiń kontrole"));
    expect(container.querySelectorAll(".ats-findings li").length).toBe(3);
  });
});

describe("report header", () => {
  it("keeps the overall-quality label below the score ring", () => {
    const { container } = render(<ReportView paid data={createMockReport()} mockMode={false} locale="pl"/>);
    const mobileScore = container.querySelector(".report-mobile-score");
    const desktopScore = container.querySelector(".secondary-score");

    expect(mobileScore?.firstElementChild?.classList.contains("score-ring-with-caption")).toBe(true);
    expect(mobileScore?.lastElementChild?.textContent).toBe("OGÓLNA JAKOŚĆ KOMUNIKACJI CV");
    expect(desktopScore?.firstElementChild?.classList.contains("score-ring-with-caption")).toBe(true);
    expect(desktopScore?.lastElementChild?.textContent).toBe("OGÓLNA JAKOŚĆ KOMUNIKACJI CV");
    expect(mobileScore?.querySelector(".score-ring-caption")?.textContent).toBe("Wymaga dopracowania");
  });

  it("places perceived and target labels on the seniority ladder without repeating the level", () => {
    const report = createMockReport("senior");
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);

    const heading = container.querySelector(".report-title h2");
    expect(heading?.textContent).toBe(report.document.perceivedRole);
    expect(container.querySelector(".report-target")).toBeNull();
    expect(container.querySelector(".report-sidebar > .perceived-level")).toBeNull();
    expect(container.querySelector(".seniority-track .is-perceived")?.textContent).toContain("Wrażenie");
    expect(container.querySelector(".seniority-track .is-target")?.textContent).toContain("Aplikujesz na");
  });

  it("shows separate dots when the document impression differs from the target", () => {
    const { container } = render(<ReportView paid data={createMockReport("mid")} mockMode={false} locale="pl"/>);
    const track = container.querySelector(".seniority-track");

    expect(track?.querySelectorAll(".is-perceived i, .is-target i")).toHaveLength(2);
    expect(track?.querySelector(".is-perceived")?.textContent).toContain("WrażenieSenior");
    expect(track?.querySelector(".is-target")?.textContent).toContain("MidAplikujesz");
  });

  it("says the level was inferred when no target was chosen", () => {
    const report = createMockReport("auto");
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    expect(container.querySelector(".seniority-auto")?.textContent).toBe("Poziom wykrywany z treści CV");
  });

  it("uses one concise role in the profile heading", () => {
    const report = createMockReport("senior");
    report.document.perceivedRole = "Senior Frontend Engineer / Frontend Developer specjalizujący się w React";
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);

    expect(container.querySelector(".report-title h2")?.textContent).toBe("Senior Frontend Engineer");
    expect(container.querySelector(".report-mobile-signals strong")?.textContent).toBe("Senior Frontend Engineer");
  });
});

describe("full report clarity", () => {
  it("keeps the finding hierarchy as diagnosis, solution, proposed wording and evidence", () => {
    const report = createMockReport();
    report.issues[0].suggestion!.proposed = "Przykładowy bezpieczny zapis oparty wyłącznie na faktach z CV.";
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    const issues = container.querySelectorAll(".issues article");

    const proposed = issues[0].querySelector(".issue-proposed");
    const evidence = issues[0].querySelector(".issue-evidence");
    expect(proposed?.textContent).toContain("PROPONOWANY ZAPIS");
    const proposedBeforeEvidence = proposed && evidence ? Boolean(proposed.compareDocumentPosition(evidence) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    expect(proposedBeforeEvidence).toBe(true);
    // issues[0] carries exactly one evidenceRef in the mock fixture, so the singular label is correct here.
    expect(evidence?.textContent).toContain("DOWÓD Z CV");
    expect(issues[1].querySelector(".issue-evidence")).toBeNull();
  });

  it("sets evidence-card columns from the evidence count, capped at three", () => {
    const report = createMockReport();
    report.issues[1].evidenceRefs = ["seg_exp_1", "seg_summary"];
    report.issues[2].evidenceRefs = ["seg_exp_1", "seg_summary", "seg_project_1", "missing"];
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    const evidence = container.querySelectorAll<HTMLElement>(".issue-evidence");

    expect(evidence[0].dataset.evidenceCount).toBe("1");
    expect(evidence[1].dataset.evidenceCount).toBe("2");
    expect(evidence[2].dataset.evidenceCount).toBe("3");
  });

  it("opens report articles in a new tab without exposing report data in the URL", () => {
    const { container } = render(<ReportView paid data={createMockReport()} mockMode={false} locale="pl"/>);
    const articleLinks = container.querySelectorAll<HTMLAnchorElement>(".report-knowledge a");

    expect(articleLinks.length).toBeGreaterThan(0);
    articleLinks.forEach((link) => {
      expect(link.target).toBe("_blank");
      expect(link.rel).toContain("noopener");
      expect(link.href).not.toContain("report");
    });
  });
});

describe("severity wording matches between teaser and full report", () => {
  it("labels an important issue the same way the free teaser already called it", () => {
    const report = createMockReport();
    report.issues = report.issues.map((issue) => ({ ...issue, severity: "important" as const }));
    const { container } = render(<ReportView paid data={report} mockMode={false} locale="pl"/>);
    const badges = [...container.querySelectorAll(".issues header > span.severity")].map((node) => node.textContent);
    expect(badges).toEqual(badges.map(() => "Istotny"));
    expect(badges.some((text) => text?.toLowerCase() === "important")).toBe(false);
  });
});
