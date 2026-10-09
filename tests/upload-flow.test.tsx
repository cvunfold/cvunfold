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
  initialRole: "frontend_developer" as const,
  initialSeniority: "junior" as const,
  handoffFromMobile: false,
  locale: "pl" as const,
};

describe("mobile upload measurement", () => {
  it("shows the seniority field as a dropdown matching the role field, with an empty required stage", () => {
    const { container } = render(<UploadFlow {...props} initialSeniority={null}/>);
    const trigger = screen.getByRole("combobox", { name: /Etap kariery/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.textContent).toContain("Wybierz etap kariery");
    expect(container.querySelector(".role-label-optional")?.textContent).toBe("(wymagane)");
    expect(screen.queryByRole("radio")).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByText("Na jaki etap aplikujesz?")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Senior" })).toBeTruthy();
  });

  it("uses the same target-level framing in English and closes on pick", () => {
    render(<UploadFlow {...props} locale="en"/>);
    fireEvent.click(screen.getByRole("combobox", { name: /Career stage/ }));
    expect(screen.getByText("What career stage are you applying for?")).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Senior" }));
    expect(screen.getByRole("combobox", { name: /Career stage/ }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("combobox", { name: /Career stage/ }).textContent).toContain("Senior");
  });

  it("shows an explicit level from a handoff link directly, without opening the popover", () => {
    render(<UploadFlow {...props} initialSeniority="senior"/>);
    const trigger = screen.getByRole("combobox", { name: /Etap kariery/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.textContent).toContain("Senior");
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

  it("offers a single plan with no job-matching upsell in the form", () => {
    render(<UploadFlow {...props} mockMode/>);
    expect(screen.queryByRole("textbox", { name: /Treść ogłoszenia/ })).toBeNull();
    expect(screen.queryByText(/Dopasuj analizę do konkretnej oferty/)).toBeNull();
    expect(screen.getByText("Pełny raport")).toBeTruthy();
    expect(screen.getByText("29 zł")).toBeTruthy();
    expect(screen.queryByText("39 zł")).toBeNull();
  });

  it("offers the sample report without costing the visitor their form state", () => {
    // Someone who clicks the hero CTA lands here directly and never passes the
    // landing page's sample link, so this is their only chance to see one. It must
    // open in a new tab: navigating away discards the picked file, the detected
    // role and the consent checkbox. It closes the sidebar, after the evidence note.
    const { container } = render(<UploadFlow {...props}/>);
    const aside = container.querySelector(".analysis-aside")!;
    const link = aside.querySelector<HTMLAnchorElement>(".analysis-sample-link")!;
    expect(link).not.toBeNull();
    expect(aside.lastElementChild).toBe(link);
    expect(link.getAttribute("href")).toBe("/przykladowy-raport?profile=junior");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("aria-label")).toContain("nowej karcie");
  });

  it("points the sample link at the English report for English visitors", () => {
    const { container } = render(<UploadFlow {...props} locale="en"/>);
    const link = container.querySelector<HTMLAnchorElement>(".analysis-sample-link")!;
    expect(link.getAttribute("href")).toBe("/en/sample-report?profile=junior");
    expect(link.getAttribute("aria-label")).toContain("new tab");
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
    render(<UploadFlow {...props} initialRole="qa_test_automation" initialSeniority="senior"/>);
    fireEvent.click(screen.getByRole("button", { name: "Nie masz CV na telefonie? Udostępnij link na komputer" }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    const url = new URL(share.mock.calls[0][0].url);
    expect(Object.fromEntries(url.searchParams)).toEqual({ plan: "full_review", role: "qa_test_automation", seniority: "senior", handoff: "mobile" });
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

describe("role prefill from the chosen file", () => {
  function pickFile(container: HTMLElement) {
    const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(picker, { target: { files: [new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" })] } });
  }

  function mockDetection(payload: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sets the detected role and says so, without touching the analysis quota", async () => {
    const fetchMock = mockDetection({ detected: true, role: "backend_developer" });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Rola docelowa" }).textContent).toContain("Backend Developer"));
    expect(container.querySelector(".role-detection.applied")?.textContent).toContain("Ustawiliśmy tę rolę na podstawie Twojego CV");
    expect(fetchMock).toHaveBeenCalledWith("/api/detect-role", expect.objectContaining({ method: "POST" }));
    expect(trackAnalyticsEvent).toHaveBeenCalledWith("role_autodetected", expect.objectContaining({
      detected_role_enum: "backend_developer", broad_role_enum: "backend_developer",
    }));
  });

  it("leaves the form untouched when the detector is not confident", async () => {
    mockDetection({ detected: false });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);

    await waitFor(() => expect(container.querySelector(".role-detection")).toBeNull());
    expect(screen.getByRole("combobox", { name: "Rola docelowa" }).textContent).toContain("Frontend Developer");
  });

  it("never overrides a role the visitor picked themselves", async () => {
    mockDetection({ detected: true, role: "backend_developer" });
    const { container } = render(<UploadFlow {...props}/>);
    fireEvent.click(screen.getByRole("combobox", { name: "Rola docelowa" }));
    fireEvent.click(screen.getByRole("option", { name: /QA \/ Test Automation/ }));
    pickFile(container);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Rola docelowa" }).textContent).toContain("QA / Test Automation"));
    expect(trackAnalyticsEvent).not.toHaveBeenCalledWith("role_autodetected", expect.anything());
  });

  it("reports a correction so the detector's real-world error rate is measurable", async () => {
    mockDetection({ detected: true, role: "backend_developer" });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);
    await waitFor(() => expect(container.querySelector(".role-detection.applied")).toBeTruthy());

    fireEvent.click(screen.getByRole("combobox", { name: "Rola docelowa" }));
    fireEvent.click(screen.getByRole("option", { name: /Mobile Developer/ }));

    expect(trackAnalyticsEvent).toHaveBeenCalledWith("role_autodetect_corrected", expect.objectContaining({
      detected_role_enum: "backend_developer", broad_role_enum: "mobile_developer",
    }));
    expect(container.querySelector(".role-detection")).toBeNull();
  });

  it("stays silent when detection fails outright", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);

    await waitFor(() => expect(container.querySelector(".role-detection")).toBeNull());
    expect(screen.getByRole("combobox", { name: "Rola docelowa" }).textContent).toContain("Frontend Developer");
  });
});

describe("where the submitted role came from", () => {
  // broad_role_enum alone cannot answer this: `frontend_developer` is both the
  // detector's answer and the untouched form default, and the funnel event is
  // written before the CV is parsed. Ads traffic showed the two diverging.
  function pickFile(container: HTMLElement) {
    const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(picker, { target: { files: [new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" })] } });
  }

  function mockBothEndpoints(detection: unknown) {
    const submitted: FormData[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/detect-role") return { ok: true, json: async () => detection };
      submitted.push(init?.body as FormData);
      return { ok: true, json: async () => ({ reportPath: "/raport", accessToken: "t" }) };
    }));
    return submitted;
  }

  async function submitAfterDetection(container: HTMLElement, submitted: FormData[]) {
    fireEvent.click(screen.getByRole("checkbox", { name: /Zlecam rozpoczęcie analizy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Analizuj CV" }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    return submitted[0];
  }

  it("labels a role the detector picked", async () => {
    const submitted = mockBothEndpoints({ detected: true, role: "backend_developer" });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);
    await waitFor(() => expect(container.querySelector(".role-detection.applied")).toBeTruthy());

    const form = await submitAfterDetection(container, submitted);
    expect(form.get("roleSource")).toBe("autodetected");
    expect(form.get("detectedRole")).toBe("backend_developer");
    expect(form.get("role")).toBe("backend_developer");
  });

  it("keeps the detector's answer when the visitor overrides it", async () => {
    const submitted = mockBothEndpoints({ detected: true, role: "backend_developer" });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);
    await waitFor(() => expect(container.querySelector(".role-detection.applied")).toBeTruthy());
    fireEvent.click(screen.getByRole("combobox", { name: "Rola docelowa" }));
    fireEvent.click(screen.getByRole("option", { name: /Mobile Developer/ }));

    const form = await submitAfterDetection(container, submitted);
    expect(form.get("roleSource")).toBe("user_chose");
    expect(form.get("role")).toBe("mobile_developer");
    // Losing this would erase the only signal of how often the detector is wrong.
    expect(form.get("detectedRole")).toBe("backend_developer");
  });

  it("separates an untouched default from a detected frontend developer", async () => {
    const submitted = mockBothEndpoints({ detected: false });
    const { container } = render(<UploadFlow {...props}/>);
    pickFile(container);
    await waitFor(() => expect(container.querySelector(".role-detection")).toBeNull());

    const form = await submitAfterDetection(container, submitted);
    expect(form.get("role")).toBe("frontend_developer");
    expect(form.get("roleSource")).toBe("not_detected");
    expect(form.get("detectedRole")).toBeNull();
  });
});

describe("consent guard", () => {
  it("keeps the submit button natively disabled until consent is given", () => {
    render(<UploadFlow {...props} mockMode/>);
    expect((screen.getByRole("button", { name: "Analizuj CV" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("pulses the consent box red instead of submitting on a click through the disabled button", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<UploadFlow {...props} mockMode/>);

    // A disabled <button> never dispatches click at all, in the browser or in
    // jsdom — the wrapper span is what actually receives the click a real
    // pointer would land on it via hit-testing (CSS gives the disabled button
    // pointer-events:none for exactly this).
    fireEvent.click(container.querySelector(".submit-wrap")!);

    expect(fetch).not.toHaveBeenCalled();
    expect(container.querySelector(".consent.attention")).toBeTruthy();
  });

  it("clears the red pulse the moment consent is given, in favour of the given state", () => {
    const { container } = render(<UploadFlow {...props} mockMode/>);
    fireEvent.click(container.querySelector(".submit-wrap")!);
    expect(container.querySelector(".consent.attention")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /Zlecam rozpoczęcie analizy/ }));

    expect(container.querySelector(".consent.attention")).toBeNull();
    expect(container.querySelector(".consent.is-given")).toBeTruthy();
  });

  it("does not block submission once consent is given", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<UploadFlow {...props} mockMode/>);
    fireEvent.click(screen.getByRole("checkbox", { name: /Zlecam rozpoczęcie analizy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Analizuj CV" }));
    expect(fetch).toHaveBeenCalledOnce();
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


describe("career context selection", () => {
  it("preserves bootcamp selection on a clean desktop handoff without changing seniority", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<UploadFlow {...props}/>);
    fireEvent.click(screen.getByRole("combobox", { name: "Etap kariery (wymagane)" }));
    fireEvent.click(screen.getByRole("option", { name: /Pierwsza praca w IT/ }));
    expect(screen.getByRole("combobox", { name: /Etap kariery/ }).textContent).toContain("Pierwsza praca w IT");
    expect(screen.getByRole("link", { name: /Zobacz przykładowy raport/ }).getAttribute("href")).toBe("/przykladowy-raport?profile=first_job");
    fireEvent.click(screen.getAllByRole("button", { name: /Udostępnij link na komputer/ })[0]);
    await waitFor(() => expect(share).toHaveBeenCalled());
    const url = new URL(share.mock.calls[0][0].url);
    expect(url.searchParams.has("careerContext")).toBe(false);
    expect(url.searchParams.get("seniority")).toBe("first_job");
    expect(url.searchParams.has("gclid")).toBe(false);
  });

  it("submits first-job context independently of the chosen target and without analytics content", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reportPath: "/en/report" }) });
    vi.stubGlobal("fetch", fetch);
    render(<UploadFlow {...props} mockMode locale="en" initialSeniority="junior"/>);
    fireEvent.click(screen.getByRole("combobox", { name: "Career stage (required)" }));
    fireEvent.click(screen.getByRole("option", { name: /First job in tech/ }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Analyse my CV" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const form = fetch.mock.calls.find(call => call[0] === "/api/analyses")?.[1].body as FormData;
    expect(form.has("careerContext")).toBe(false);
    expect(form.get("seniority")).toBe("first_job");
    expect(JSON.stringify(trackAnalyticsEvent.mock.calls)).not.toContain("careerContext");
  });
});


describe("transparent career-stage prefill", () => {
  const pick = (container: HTMLElement) => fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" })] } });
  it("requires a choice and offers five stages without an unknown option", () => {
    render(<UploadFlow {...props} mockMode initialSeniority={null}/>);
    fireEvent.click(screen.getByRole("checkbox"));
    expect((screen.getByRole("button", { name: "Analizuj CV" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("combobox", { name: /Etap kariery/ }));
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.queryByText(/Nie wiem/)).toBeNull();
    fireEvent.click(screen.getByRole("option", { name: "Junior" }));
    expect((screen.getByRole("button", { name: "Analizuj CV" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("prefills a clear stage even when no specialization is detected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ detected: false, seniority: "junior" }) }));
    const { container } = render(<UploadFlow {...props} initialSeniority={null}/>);
    pick(container);
    await waitFor(() => expect(screen.getByRole("combobox", { name: /Etap kariery/ }).textContent).toContain("Junior"));
    expect(screen.getByText(/Wykryliśmy etap na podstawie CV/)).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: /Etap kariery/ }));
    fireEvent.click(screen.getByRole("option", { name: "Mid" }));
    expect(screen.queryByText(/Wykryliśmy etap/)).toBeNull();
    pick(container);
    await act(async () => {});
    expect(screen.getByRole("combobox", { name: /Etap kariery/ }).textContent).toContain("Mid");
  });
  it("leaves uncertain stages empty in English", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ detected: true, role: "backend_developer", seniority: null }) }));
    const { container } = render(<UploadFlow {...props} initialSeniority={null} locale="en"/>);
    pick(container);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Target role" }).textContent).toContain("Backend"));
    expect(screen.getByRole("combobox", { name: /Career stage/ }).textContent).toContain("Choose a career stage");
  });
});
