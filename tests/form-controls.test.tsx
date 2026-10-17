// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormSelect } from "@/components/form-select";
import { FilePicker } from "@/components/file-picker";
import { SchoolReportRating } from "@/components/schools/report-rating";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("application form controls", () => {
  it("supports keyboard selection, Escape, focus restoration and form values", () => {
    render(<form aria-label="Feedback"><FormSelect name="rating" label="Ocena" defaultValue="5" options={[{ id: "5", label: "5" }, { id: "4", label: "4" }]}/></form>);
    const trigger = screen.getByRole("combobox", { name: "Ocena" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger.textContent).toContain("4");
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("rating")).toBe("4");
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger); fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("opens the hidden file picker from a keyboard-accessible button and blocks it while busy", () => {
    const onChange = vi.fn(); const file = new File(["synthetic"], "fixture.pdf", { type: "application/pdf" });
    const view = render(<FilePicker label="Poprawione CV" files={[]} onChange={onChange}/>);
    const input = screen.getByLabelText("Poprawione CV", { selector: "input" }) as HTMLInputElement;
    const open = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: /Poprawione CV/ })); expect(open).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { files: [file] } }); expect(onChange).toHaveBeenCalledOnce();
    view.rerender(<FilePicker label="Poprawione CV" files={[file]} onChange={onChange} disabled/>);
    expect(screen.getByRole("status").textContent).toContain("fixture.pdf");
    fireEvent.click(screen.getByRole("button", { name: /Poprawione CV/ })); expect(open).toHaveBeenCalledOnce();
    expect(input.hidden).toBe(true);
  });
  it("does not submit an issue that disappeared after switching report versions", () => {
    const view = render(<form aria-label="Feedback"><FormSelect label="Zakres" name="issueId" options={[{ id: "", label: "Cały raport" }, { id: "old", label: "Stara uwaga" }]}/></form>);
    fireEvent.click(screen.getByRole("combobox", { name: "Zakres" })); fireEvent.click(screen.getByRole("option", { name: "Stara uwaga" }));
    view.rerender(<form aria-label="Feedback"><FormSelect label="Zakres" name="issueId" options={[{ id: "", label: "Cały raport" }, { id: "new", label: "Nowa uwaga" }]}/></form>);
    expect(screen.getByRole("combobox", { name: "Zakres" }).textContent).toContain("Cały raport");
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("issueId")).toBe("");
  });
  it("submits custom rating and accuracy selections to the existing feedback API", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetch);
    render(<SchoolReportRating id="synthetic" version={1}/>);
    fireEvent.click(screen.getByRole("radio", { name: "Ocena 3 z 5" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Trafność" })); fireEvent.click(screen.getByRole("option", { name: "Częściowo" }));
    fireEvent.click(screen.getByRole("button", { name: "Wyślij ocenę" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Dziękujemy"));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toMatchObject({ version: 1, rating: 3, accurate: "partly", comment: "", requestId: expect.any(String) });
  });
  it("focuses cancellation first, preserves deletion errors and prevents dismissing an active request", () => {
    const onCancel = vi.fn(), onConfirm = vi.fn();
    const view = render(<ConfirmationDialog title="Usunąć raport?" description="Tej operacji nie można cofnąć." confirmLabel="Usuń raport" busy={false} onCancel={onCancel} onConfirm={onConfirm}/>);
    const dialog = screen.getByRole("dialog", { name: "Usunąć raport?" });
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Anuluj" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Anuluj" })); expect(onCancel).toHaveBeenCalledOnce(); expect(onConfirm).not.toHaveBeenCalled();
    view.rerender(<ConfirmationDialog title="Usunąć raport?" description="Tej operacji nie można cofnąć." confirmLabel="Usuń raport" busy error="Spróbuj ponownie" onCancel={onCancel} onConfirm={onConfirm}/>);
    fireEvent(dialog, new Event("cancel", { cancelable: true })); expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain("Spróbuj ponownie");
  });
});
