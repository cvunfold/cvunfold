// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolPanel } from "@/components/schools/school-panel";
import type { SchoolData } from "@/lib/schools/model";
const initialData: SchoolData = { schoolName: "Szkoła testowa", groupId: "11111111-1111-4111-8111-111111111111", groups: [
  { id: "11111111-1111-4111-8111-111111111111", name: "Frontend A", target_role: "frontend_developer", target_seniority: "first_job" },
], students: [] };
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const response = (payload: unknown, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => payload });

describe("delete group confirmation", () => {
  it("shows the group name and consequences, and cancelling sends no request", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę" }));
    const dialog = screen.getByRole("dialog", { name: "Usunąć tę grupę?" });
    expect(dialog.textContent).toContain("Frontend A");
    expect(dialog.textContent).toContain("wszystkie analizy, raporty");
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Anuluj" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Grupa" }).textContent).toContain("Frontend A");
  });
  it.each([false, true])("refreshes after confirmation and handles remaining groups: %s", async hasOther => {
    const other = { ...initialData.groups[0], id: "22222222-2222-4222-8222-222222222222", name: "Frontend B" };
    const updated = { ...initialData, groups: hasOther ? [other] : [], groupId: hasOther ? other.id : null };
    const fetch = vi.fn().mockResolvedValueOnce(response({ ok: true })).mockResolvedValueOnce(response(updated));
    vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={hasOther ? { ...initialData, groups: [...initialData.groups, other] } : initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj CV kursantów" }));
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Usuń grupę" }));
    await waitFor(() => expect(screen.getByText("Grupa i powiązane dane kursantów zostały usunięte.")).toBeTruthy());
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/schools", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ groupId: initialData.groupId, confirmed: true }) }));
    expect(screen.queryByRole("heading", { name: "Dodaj kilka CV" })).toBeNull();
    if (hasOther) {
      await waitFor(() => expect(screen.getByRole("combobox", { name: "Grupa" }).textContent).toContain("Frontend B"));
    } else {
      expect(screen.getByText("Utwórz pierwszą grupę, aby dodać CV kursantów.")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Usuń grupę" })).toBeNull();
    }
  });
  it("preserves the group after a failed deletion", async () => {
    const fetch = vi.fn().mockResolvedValue(response({ error: "Nie udało się usunąć grupy." }, false));
    vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Usuń grupę" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Nie udało się usunąć grupy."));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Grupa" }).textContent).toContain("Frontend A");
  });
  it("keeps a deleted group out of the panel even when refreshing fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ ok: true })).mockRejectedValueOnce(new Error("offline")));
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Usuń grupę" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Grupa została usunięta"));
    expect(screen.queryByRole("button", { name: "Usuń grupę" })).toBeNull();
  });
  it("closes on Escape without deleting", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("offers no deletion in the public demo", () => {
    render(<SchoolPanel initialData={initialData} demo/>);
    expect(screen.queryByRole("button", { name: "Usuń grupę" })).toBeNull();
  });
});
