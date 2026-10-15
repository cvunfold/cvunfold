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

    const hook = screen.getByRole("heading", { name: "W Twoim CV są miejsca, które mogą osłabiać jego odbiór." }).closest("section");
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

  it("shows severity with correct Polish inflection, without pricing the report per finding", () => {
    const teaser = { ...toTeaser(createMockReport()), issueCount: 5, severityCounts: { critical: 1, important: 3, minor: 1 } };
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);
    expect(screen.getByText("1 kluczowy · 3 istotne · 1 drobny")).toBeTruthy();
    // The count led readers to price the report per finding, and it shrinks as the
    // CV improves, so the strongest candidates saw the weakest offer.
    expect(container.textContent).not.toContain("Wykryliśmy 5");
    expect(container.querySelector(".locked")?.textContent).not.toContain("1 z 5");
  });

  it("lets an undecided reader see a full report before paying, without losing their own", () => {
    // The paywall asks for 99 zł from someone who has never seen a full report.
    // New tab: the teaser is a private session the reader should not navigate off.
    const teaser = toTeaser(createMockReport());
    const { container } = render(<ReportView paid={false} data={teaser} mockMode={false} locale="pl"/>);
    const link = container.querySelector<HTMLAnchorElement>(".locked .locked-sample-link")!;
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/przykladowy-raport");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    // It has to precede the buy button: it is evidence for the decision, not an afterthought.
    const cta = container.querySelector(".locked-payment-actions")!;
    expect(link.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    // The band label itself is covered in score-band.test.ts. Asserting a specific
    // one here coupled a layout test to the mock's weighted score, so it broke when
    // the auto rubric stopped using senior weights.
    expect(mobileScore?.querySelector(".score-ring-caption")?.textContent).toBeTruthy();
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
    const { container } = render(<ReportView paid data={{ ...createMockReport("senior"), document: { ...createMockReport("senior").document, targetSeniority: "lead" } }} mockMode={false} locale="pl"/>);
    const track = container.querySelector(".seniority-track");

    expect(track?.querySelectorAll(".is-perceived i, .is-target i")).toHaveLength(2);
    expect(track?.querySelector(".is-perceived")?.textContent).toContain("WrażenieSenior");
    expect(track?.querySelector(".is-target")?.textContent).toContain("LeadAplikujesz");
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


describe("career-stage report presentation", () => {
  for (const locale of ["pl", "en"] as const) it(`focuses the bootcamp report on projects rather than a seniority ladder (${locale})`, () => {
    const report = createMockReport("auto", false, "frontend_developer", locale, "first_job");
    report.issues[0].category = "ownership";
    const { container } = render(<ReportView paid data={report} mockMode={false} locale={locale}/>);
    expect(container.querySelector(".seniority-track")).toBeNull();
    expect(container.querySelector(".career-focus")?.textContent).toContain(locale === "pl" ? "Podstawy, projekty i własny wkład" : "Fundamentals, projects and personal contribution");
    expect(container.textContent).toContain(locale === "pl" ? "Twój wkład w projekty" : "Your project contribution");
    expect(container.textContent).not.toMatch(/Dlaczego ownership jest ważny|Why ownership matters|Jak pokazać seniority|How to show seniority/);
    expect(container.textContent).not.toMatch(/Ownership i odpowiedzialność|Ownership and responsibility|Sygnały poziomu w kategoriach|Seniority signals by category/);
  });

  it("focuses Mid on independence and decisions without removing Senior's ladder", () => {
    const mid = render(<ReportView paid data={createMockReport("mid")} mockMode={false} locale="pl"/>);
    expect(mid.container.querySelector(".seniority-track")).toBeNull();
    expect(mid.container.textContent).toContain("Samodzielność i zakres zadań");
    mid.unmount();
    const senior = render(<ReportView paid data={createMockReport("senior")} mockMode={false} locale="pl"/>);
    expect(senior.container.querySelector(".seniority-track")).not.toBeNull();
  });
});


it("uses the Mid presentation when auto detects a Mid profile", () => {
  const report = createMockReport("mid");
  report.document.targetSeniority = "auto";
  const { container } = render(<ReportView paid data={report} mockMode={false} locale="en"/>);
  expect(container.querySelector(".seniority-track")).toBeNull();
  expect(container.textContent).toContain("Skills and independence shown in the CV");
});


describe("revision summary access and repetition", () => {
  it.each(["pl", "en"] as const)("shows copying only with full access (%s)", locale => {
    const report = createMockReport("first_job", false, "frontend_developer", locale);
    const title = locale === "pl" ? "Skopiuj podsumowanie" : "Copy summary";
    const unpaid = render(<ReportView paid={false} data={toTeaser(report)} mockMode={false} locale={locale}/>);
    expect(screen.queryByRole("button", { name: title })).toBeNull();
    unpaid.unmount();
    const view = render(<ReportView paid data={report} mockMode={false} locale={locale}/>);
    expect(screen.getByRole("button", { name: title })).toBeTruthy();
    expect(view.container.querySelector(".improve")).toBeNull();
    expect(view.container.querySelector(".revision-brief details")?.hasAttribute("open")).toBe(false);
  });
  it("keeps a readable manual fallback when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<ReportView paid data={createMockReport("first_job")} mockMode={false} locale="pl"/>);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Skopiuj podsumowanie" })); });
    expect(screen.getByText("Kopiowanie się nie udało. Rozwiń podsumowanie i skopiuj tekst ręcznie.")).toBeTruthy();
    expect(screen.getByText("Pokaż tekst do skopiowania")).toBeTruthy();
  });
  it("copies the briefing locally without sending its content to analytics", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ReportView paid data={createMockReport("first_job")} mockMode={false} locale="pl"/>);
    analytics.mockClear();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Skopiuj podsumowanie" })); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("Nie dopisuj doświadczenia");
    expect(analytics).not.toHaveBeenCalled();
  });
});
