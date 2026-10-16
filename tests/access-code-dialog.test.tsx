// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccessCodeDialog } from "@/components/access-code-dialog";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const shortcut = (target: Window | HTMLElement = window) => { for (const key of "code") fireEvent.keyDown(target, { key }); };
describe("hidden access-code form", () => {
  it("reveals only after the shortcut, focuses the field, and closes on Escape", () => {
    render(<AccessCodeDialog/>); expect(screen.queryByRole("dialog")).toBeNull();
    shortcut(); const dialog = screen.getByRole("dialog"); expect(document.activeElement).toBe(screen.getByLabelText("Kod dostępu"));
    fireEvent(dialog, new Event("cancel", { cancelable: true })); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("never triggers while editing a CV, email or other field", () => {
    render(<><textarea aria-label="CV"/><AccessCodeDialog/></>); const input = screen.getByLabelText("CV"); input.focus(); shortcut(input); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps invalid-code feedback inline and shows the upload action after acceptance", async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 403 }).mockResolvedValueOnce({ ok: true, json: async () => ({ accepted: true }) }); vi.stubGlobal("fetch", fetch);
    render(<AccessCodeDialog/>); shortcut(); fireEvent.change(screen.getByLabelText("Kod dostępu"), { target: { value: "komuna" } });
    fireEvent.click(screen.getByRole("button", { name: "Użyj kodu" })); await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("nieprawidłowy"));
    fireEvent.click(screen.getByRole("button", { name: "Użyj kodu" })); await waitFor(() => expect(screen.getByRole("link", { name: "Prześlij CV" }).getAttribute("href")).toBe("/analiza"));
    expect(fetch).toHaveBeenCalledWith("/api/report/access-code", expect.objectContaining({ method: "POST", body: JSON.stringify({ code: "komuna" }) }));
  });
});
