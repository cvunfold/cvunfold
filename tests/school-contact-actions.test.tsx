// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactActions } from "@/components/schools/contact-actions";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const contact = { emails: ["anna+cv@example.com"], phones: [{ number: "+48501234567", label: "+48 501 234 567" }] };

describe("student contact actions", () => {
  it("copies the literal displayed contact and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ContactActions contact={contact} name="Anna"/>);
    expect(screen.queryByText("anna+cv@example.com")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "E-mail: Anna" }));
    expect(screen.getByRole("link", { name: "Wyślij" }).getAttribute("href")).toBe("mailto:anna%2Bcv%40example.com");
    fireEvent.click(screen.getByRole("button", { name: "Skopiuj" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Skopiowano"));
    expect(writeText).toHaveBeenCalledWith("anna+cv@example.com");
  });
  it("handles clipboard failure, dismissal and keyboard focus", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<ContactActions contact={contact} name="Anna"/>);
    const trigger = screen.getByRole("button", { name: "Telefon: Anna" });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "Zadzwoń" }).getAttribute("href")).toBe("tel:+48501234567");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Zadzwoń" }));
    fireEvent.click(screen.getByRole("button", { name: "Skopiuj" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Nie udało się"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("does not render unsafe contact values", () => {
    render(<ContactActions contact={{ emails: ["javascript:alert(1)"], phones: [] }} name="Anna"/>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Brak danych kontaktowych")).toBeTruthy();
  });
});
