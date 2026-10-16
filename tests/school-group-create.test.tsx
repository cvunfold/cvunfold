// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolPanel } from "@/components/schools/school-panel";
import type { SchoolData } from "@/lib/schools/model";

const initialData: SchoolData = { schoolName: "Szkoła testowa", groupId: "11111111-1111-4111-8111-111111111111", groups: [
  { id: "11111111-1111-4111-8111-111111111111", name: "Frontend A", target_role: "frontend_developer", target_seniority: "first_job" },
], students: [] };
const response = (payload: unknown, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => payload });
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("new school group modal", () => {
  it("focuses the name and restores focus after cancelling without sending a request", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    const trigger = screen.getByRole("button", { name: "Nowa grupa" });
    trigger.focus(); fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Nowa grupa" });
    expect(document.activeElement).toBe(within(dialog).getByRole("textbox", { name: "Nazwa grupy" }));
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(dialog).getByRole("button", { name: "Anuluj" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("creates a group with the selected criteria and switches to it after closing", async () => {
    const created = { id: "22222222-2222-4222-8222-222222222222", name: "Backend B", target_role: "backend_developer", target_seniority: "junior" };
    const updated = { ...initialData, groups: [...initialData.groups, created], groupId: created.id };
    const fetch = vi.fn().mockResolvedValueOnce(response({ ok: true })).mockResolvedValueOnce(response(updated)).mockResolvedValueOnce(response(updated));
    vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Nowa grupa" }));
    const dialog = screen.getByRole("dialog", { name: "Nowa grupa" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nazwa grupy" }), { target: { value: created.name } });
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Rola docelowa" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Backend Developer" }));
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Etap kariery" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Junior z doświadczeniem" }));
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/schools", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: created.name, role: created.target_role, seniority: created.target_seniority }) }));
    expect(screen.getByRole("combobox", { name: "Grupa" }).textContent).toContain(created.name);
  });
  it("keeps entered values and shows a single error inside the modal after failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ error: "Nie udało się utworzyć grupy." }, false)));
    render(<SchoolPanel initialData={initialData}/>);
    fireEvent.click(screen.getByRole("button", { name: "Nowa grupa" }));
    const dialog = screen.getByRole("dialog", { name: "Nowa grupa" });
    const input = within(dialog).getByRole("textbox", { name: "Nazwa grupy" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Frontend B" } });
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(within(dialog).getByRole("alert").textContent).toContain("Nie udało się utworzyć grupy."));
    expect(input.value).toBe("Frontend B");
    expect(input.disabled).toBe(false);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
  it("handles Escape and backdrop clicks, but does not close during submission", async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    const fetch = vi.fn(() => new Promise<ReturnType<typeof response>>(resolve => { finish = resolve; }));
    vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={initialData}/>);
    const trigger = screen.getByRole("button", { name: "Nowa grupa" });
    fireEvent.click(trigger);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger);
    let dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, right: 500, bottom: 600 } as DOMRect);
    fireEvent.click(dialog, { clientX: 200, clientY: 200 });
    expect(screen.getByRole("dialog")).toBe(dialog);
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger);
    dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nazwa grupy" }), { target: { value: "Frontend B" } });
    fireEvent.submit(dialog.querySelector("form")!);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(document.activeElement).toBe(dialog);
    expect((within(dialog).getByRole("button", { name: "Anuluj" }) as HTMLButtonElement).disabled).toBe(true);
    finish(response({ error: "Spróbuj ponownie." }, false));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toBeTruthy());
    fireEvent.click(within(dialog).getByRole("button", { name: "Zamknij nową grupę" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
