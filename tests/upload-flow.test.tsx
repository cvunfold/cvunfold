// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadFlow } from "@/components/upload-flow";

const { trackAnalyticsEvent, readSafeAttribution, push } = vi.hoisted(() => ({
  trackAnalyticsEvent: vi.fn(),
  readSafeAttribution: vi.fn(() => ({ source: "google", medium: "cpc", gclid: "private-click" })),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }), usePathname: () => "/analiza" }));
vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent, readSafeAttribution }));

const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  cleanup();
  trackAnalyticsEvent.mockClear();
  readSafeAttribution.mockClear();
  push.mockClear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalShare) Object.defineProperty(navigator, "share", originalShare); else Reflect.deleteProperty(navigator, "share");
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard); else Reflect.deleteProperty(navigator, "clipboard");
});

const props = {
  mockMode: false,
  initialJobMatch: false,
  initialRole: "frontend_developer" as const,
  initialSeniority: "auto" as const,
  handoffFromMobile: false,
  locale: "pl" as const,
};

describe("mobile upload measurement", () => {
  it("frames seniority as the level the user is applying for", () => {
    render(<UploadFlow {...props}/>);
    expect(screen.getByRole("group", { name: "Na jaki poziom aplikujesz?" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Nie wiem — oceń na podstawie CV" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/To tylko punkt odniesienia/).textContent).toContain("co komunikuje Twoje CV");
  });

  it("uses the same target-level framing in English", () => {
    render(<UploadFlow {...props} locale="en"/>);
    expect(screen.getByRole("group", { name: "What level are you applying for?" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Not sure — assess from my CV" }) as HTMLInputElement).checked).toBe(true);
  });

  it("marks the Other role as experimental before the user uploads a CV", () => {
    render(<UploadFlow {...props}/>);
    expect(screen.queryByText(/Tryb eksperymentalny/)).toBeNull();
    fireEvent.click(screen.getByRole("combobox", { name: "Rola docelowa" }));
    fireEvent.click(screen.getByRole("option", { name: /Pozostałe/ }));
    const note = screen.getByRole("note");
    expect(note.textContent).toContain("zoptymalizowaliśmy i przetestowaliśmy dla wymienionych ról IT");
    expect(note.textContent).toContain("wynik może być mniej precyzyjny");
    expect(note.textContent).toContain("przed zakupem");
  });

  it("provides the same experimental disclosure in English", () => {
    render(<UploadFlow {...props} locale="en" initialRole="other"/>);
    expect(screen.getByRole("note").textContent).toContain("Other specialisations use general criteria");
  });

  it("requires the job description when job matching is selected", () => {
    render(<UploadFlow {...props} mockMode initialJobMatch/>);
    const description = screen.getByRole("textbox", { name: /Treść ogłoszenia/ }) as HTMLTextAreaElement;
    expect(description.required).toBe(true);
    expect(screen.getByText(/wymagana do dopasowania/)).toBeTruthy();
    expect(screen.getByText("39 zł")).toBeTruthy();
  });

  it("distinguishes picker open, native cancel, picker selection and drop", () => {
    const { container } = render(<UploadFlow {...props}/>);
    const dropzone = screen.getByRole("button", { name: /Przeciągnij PDF lub DOCX/ });
    const picker = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(picker).not.toBeNull();

    fireEvent.click(dropzone);
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("file_picker_opened", expect.objectContaining({ landing_variant: "developer" }));
    fireEvent(picker!, new Event("cancel"));
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("file_picker_cancelled", expect.objectContaining({ plan: "full_review" }));

    const picked = new File(["%PDF-1.4"], "picked.pdf", { type: "application/pdf" });
    fireEvent.change(picker!, { target: { files: [picked] } });
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("upload_started", expect.objectContaining({ upload_entrypoint: "picker" }));

    const dropped = new File(["PK"], "dropped.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [dropped] } });
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("upload_started", expect.objectContaining({ upload_entrypoint: "drop" }));
  });

  it("uses Web Share with a URL that excludes detailed attribution", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<UploadFlow {...props} initialJobMatch initialRole="qa_test_automation" initialSeniority="senior"/>);
    fireEvent.click(screen.getByRole("button", { name: "Nie masz CV na telefonie? Udostępnij link na komputer" }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    const url = new URL(share.mock.calls[0][0].url);
    expect(Object.fromEntries(url.searchParams)).toEqual({ plan: "job_match", role: "qa_test_automation", seniority: "senior", handoff: "mobile" });
    expect(url.searchParams.has("gclid")).toBe(false);
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("desktop_handoff_completed", expect.objectContaining({ handoff_method: "web_share" }));
  });

  it("falls back to clipboard and exposes an aria-live status", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<UploadFlow {...props} locale="en" initialRole="backend_developer" initialSeniority="mid"/>);
    fireEvent.click(screen.getByRole("button", { name: "Do not have your CV on your phone? Share a link to your computer" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(screen.getByRole("status").textContent).toContain("Link copied.");
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("desktop_handoff_completed", expect.objectContaining({ handoff_method: "clipboard" }));
  });
});

describe("analysis progress overlay", () => {
  function startAnalysis() {
    render(<UploadFlow {...props} mockMode/>);
    fireEvent.click(screen.getByRole("checkbox", { name: /Zlecam rozpoczęcie analizy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Analizuj CV" }));
  }

  it("immediately presents a focused modal progress state from any scroll position", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    startAnalysis();

    const dialog = await screen.findByRole("dialog", { name: "Analizujemy Twoje CV" });
    expect(dialog.textContent).toContain("Czytam strukturę CV");
    expect(dialog.textContent).toContain("Buduję raport");
    expect(document.activeElement).toBe(dialog);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
  });

  it("advances illustrative stages and keeps the final stage active while the request is pending", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    startAnalysis();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Czytam strukturę CV").closest("li")?.getAttribute("aria-current")).toBe("step");
    await act(async () => { await vi.advanceTimersByTimeAsync(12_800); });
    expect(within(dialog).getByText("Buduję raport").closest("li")?.getAttribute("aria-current")).toBe("step");
  });

  it("renders the redirecting state before navigating without a fixed delay", async () => {
    let navigationCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { navigationCallback = callback; return 1; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reportPath: "/raport", accessToken: "safe-token" }),
    }));
    startAnalysis();

    await screen.findByRole("dialog", { name: "Już za chwilę zostaniesz przekierowany do raportu" });
    expect(push).not.toHaveBeenCalled();
    expect(navigationCallback).not.toBeNull();
    act(() => { navigationCallback?.(0); });
    expect(push).toHaveBeenCalledWith("/raport#safe-token");
  });

  it("closes the overlay, restores scrolling and focuses a safe error message", async () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nie udało się odczytać dokumentu.", errorCategory: "unreadable_document" }),
    }));
    startAnalysis();

    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(alert);
    expect(document.body.style.overflow).toBe("");
    expect((screen.getByRole("button", { name: "Analizuj CV" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
