// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CvFlowPreview } from "@/components/cv-flow-preview";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
function currentStage() { return screen.getByRole("figure").getAttribute("data-step"); }

describe("animated CV flow", () => {
  it("pauses, resumes from the remaining time and plays a manually chosen stage", () => {
    render(<CvFlowPreview locale="pl" price="29 zł"><p>Fikcyjne CV</p></CvFlowPreview>);
    advance(2100);
    fireEvent.click(screen.getByRole("button", { name: "Wstrzymaj prezentację" }));
    advance(10000);
    expect(currentStage()).toBe("upload");
    fireEvent.click(screen.getByRole("button", { name: "Odtwórz prezentację" }));
    advance(2099);
    expect(currentStage()).toBe("upload");
    advance(1);
    expect(currentStage()).toBe("analysis");
    fireEvent.click(screen.getByRole("button", { name: "Pokaż etap: Poprawki" }));
    expect(currentStage()).toBe("revision");
    expect(screen.getByRole("heading", { name: "Najpierw pytania. Potem poprawki." })).toBeTruthy();
    expect(screen.getByText("Czeka na Twoje odpowiedzi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wstrzymaj prezentację" })).toBeTruthy();
    advance(7800);
    expect(currentStage()).toBe("improved");
    expect(screen.getByRole("link", { name: "Zobacz zmiany i pełny raport" }).getAttribute("href")).toBe("/historia-poprawy-cv");
    advance(9000);
    expect(currentStage()).toBe("upload");
  });

  it.each(["pl", "en"] as const)("keeps the scanner and progress in sync when selecting, pausing and restarting in %s", locale => {
    const { container } = render(<CvFlowPreview locale={locale} price="29"><p>CV</p></CvFlowPreview>);
    const pause = locale === "pl" ? "Wstrzymaj prezentację" : "Pause presentation";
    const play = locale === "pl" ? "Odtwórz prezentację" : "Play presentation";
    const analysis = locale === "pl" ? "Pokaż etap: Analiza" : "Show stage: Review";
    fireEvent.click(screen.getByRole("button", { name: pause }));
    fireEvent.click(screen.getByRole("button", { name: analysis }));
    const root = screen.getByRole("figure");
    expect(currentStage()).toBe("analysis");
    expect(root.getAttribute("data-running")).toBe("true");
    expect(root.style.getPropertyValue("--flow-play-state")).toBe("running");
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("false");
    advance(2300);
    const progress = container.querySelector('[aria-pressed="true"] .cv-flow-progress');
    fireEvent.click(screen.getByRole("button", { name: analysis }));
    expect(container.querySelector('[aria-pressed="true"] .cv-flow-progress')).not.toBe(progress);
    advance(2300);
    expect(currentStage()).toBe("analysis");
    fireEvent.click(screen.getByRole("button", { name: pause }));
    expect(root.style.getPropertyValue("--flow-play-state")).toBe("paused");
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("true");
    advance(10000);
    expect(currentStage()).toBe("analysis");
    fireEvent.click(screen.getByRole("button", { name: play }));
    advance(2300);
    expect(currentStage()).toBe("preview");
  });

  it("does not advance outside the viewport or while the page is hidden", () => {
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(next: IntersectionObserverCallback) { callback = next; }
      observe() {}
      disconnect() {}
    });
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    render(<CvFlowPreview locale="en" price="€9"><p>Fictional CV</p></CvFlowPreview>);
    advance(20000);
    expect(currentStage()).toBe("upload");
    act(() => callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    advance(4200);
    expect(currentStage()).toBe("analysis");
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    advance(20000);
    expect(currentStage()).toBe("analysis");
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    advance(4600);
    expect(currentStage()).toBe("preview");
  });

  it.each([
    ["pl", "Pokaż etap: Raport", "Twoja kolejność poprawek", "29 zł"],
    ["en", "Show stage: Report", "Your revision priorities", "€9"],
  ] as const)("respects reduced motion and keeps localized manual navigation in %s", (locale, label, heading, price) => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render(<CvFlowPreview locale={locale} price={price}><p>Anna Kowalska</p></CvFlowPreview>);
    advance(60000);
    expect(currentStage()).toBe("upload");
    expect(screen.queryByRole("button", { name: /prezentację|presentation/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(currentStage()).toBe("report");
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    expect(screen.getByText(price)).toBeTruthy();
    expect(screen.getByRole("button", { name: label }).getAttribute("aria-pressed")).toBe("true");
  });
});
