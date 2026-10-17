// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadedCvPreview } from "@/components/uploaded-cv-preview";
import { renderCvPreview } from "@/lib/client/cv-preview";

vi.mock("@/lib/client/cv-preview", () => ({ renderCvPreview: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

describe("uploaded CV scanner", () => {
  it.each(["pl", "en"] as const)("shows the selected PDF, stops on completion and aborts on unmount in %s", async locale => {
    vi.mocked(renderCvPreview).mockResolvedValue({ kind: "pdf", pages: 2 });
    const file = new File(["PDF"], "selected.pdf");
    const { container, rerender, unmount } = render(<UploadedCvPreview file={file} locale={locale}/>);
    const label = locale === "pl" ? "Podgląd pierwszej strony przesłanego CV" : "Preview of the first page of your uploaded CV";
    await screen.findByRole("img", { name: label });
    expect(screen.getByText("selected.pdf")).toBeTruthy();
    expect(screen.getByText(locale === "pl" ? "Strona 1 z 2" : "Page 1 of 2")).toBeTruthy();
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("false");
    rerender(<UploadedCvPreview file={file} locale={locale} complete/>);
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("true");
    const signal = vi.mocked(renderCvPreview).mock.calls[0][2];
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("renders DOCX excerpts as text, including markup-like content", async () => {
    vi.mocked(renderCvPreview).mockResolvedValue({ kind: "docx", text: "Candidate\n\n<script>alert(1)</script>" });
    const { container } = render(<UploadedCvPreview file={new File(["DOCX"], "cv.docx")} locale="pl"/>);
    await screen.findByText("Podgląd treści DOCX");
    expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("stops scanning while the page is hidden and resumes when visible", async () => {
    vi.mocked(renderCvPreview).mockResolvedValue({ kind: "pdf", pages: 1 });
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { container } = render(<UploadedCvPreview file={new File(["PDF"], "cv.pdf")} locale="en"/>);
    await screen.findByRole("img");
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("true");
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(container.querySelector(".document-scanner")?.getAttribute("data-paused")).toBe("false");
  });

  it("does not let an old preview replace a newly selected document", async () => {
    let finishOld: ((value: { kind: "docx"; text: string }) => void) | undefined;
    vi.mocked(renderCvPreview).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; })).mockResolvedValueOnce({ kind: "docx", text: "Current document" });
    const { rerender } = render(<UploadedCvPreview file={new File(["one"], "old.docx")} locale="en"/>);
    rerender(<UploadedCvPreview file={new File(["two"], "current.docx")} locale="en"/>);
    await screen.findByText("Current document");
    await act(async () => finishOld?.({ kind: "docx", text: "Old document" }));
    expect(screen.queryByText("Old document")).toBeNull();
    expect(screen.getByText("Current document")).toBeTruthy();
  });

  it("keeps a failed preview separate from the analysis state", async () => {
    vi.mocked(renderCvPreview).mockRejectedValue(new Error("Preview failure"));
    const { container } = render(<UploadedCvPreview file={new File(["x"], "cv.pdf")} locale="en"/>);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Preview unavailable. Your review continues."));
    expect(container.querySelector(".document-scanner")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
