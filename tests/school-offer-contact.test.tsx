// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolContactForm } from "@/components/schools/school-contact-form";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent: vi.fn() }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("school contact message", () => {
  it("confirms automatic delivery and clears the form after server acknowledgement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ sent: true }))));
    const { container } = render(<SchoolContactForm automaticDelivery/>);
    fireEvent.change(screen.getByLabelText("Imię i nazwisko"), { target: { value: "Test Mentor" } });
    fireEvent.change(screen.getByLabelText("Służbowy e-mail"), { target: { value: "mentor@example.com" } });
    fireEvent.change(screen.getByLabelText("Szkoła lub bootcamp"), { target: { value: "School" } });
    fireEvent.change(screen.getByLabelText("Wiadomość (opcjonalnie)"), { target: { value: "Demo please" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("została wysłana"));
    expect((screen.getByLabelText("Wiadomość (opcjonalnie)") as HTMLTextAreaElement).value).toBe("");
    expect(trackAnalyticsEvent).toHaveBeenCalledExactlyOnceWith("school_contact_sent", { locale: "pl" });
  });
  it("preserves the message and retry identity after a failed send", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Spróbuj ponownie" }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<SchoolContactForm automaticDelivery/>);
    fireEvent.change(screen.getByLabelText("Imię i nazwisko"), { target: { value: "Test Mentor" } });
    fireEvent.change(screen.getByLabelText("Służbowy e-mail"), { target: { value: "mentor@example.com" } });
    fireEvent.change(screen.getByLabelText("Szkoła lub bootcamp"), { target: { value: "School" } });
    fireEvent.change(screen.getByLabelText("Wiadomość (opcjonalnie)"), { target: { value: "Demo please" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Spróbuj ponownie"));
    expect((screen.getByLabelText("Wiadomość (opcjonalnie)") as HTMLTextAreaElement).value).toBe("Demo please");
    expect(screen.queryByRole("status")).toBeNull();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).requestId).toBe(JSON.parse(fetchMock.mock.calls[1][1].body).requestId);
  });
  it("prepares a message for the owner's address without claiming it was sent", () => {
    const { container } = render(<SchoolContactForm/>);
    fireEvent.change(screen.getByLabelText("Imię i nazwisko"), { target: { value: "Test Mentor" } });
    fireEvent.change(screen.getByLabelText("Służbowy e-mail"), { target: { value: "mentor@example.com" } });
    fireEvent.change(screen.getByLabelText("Szkoła lub bootcamp"), { target: { value: "Demo & React" } });
    fireEvent.change(screen.getByLabelText("Wiadomość (opcjonalnie)"), { target: { value: "Grupa juniorów.\nProszę o demo." } });
    fireEvent.submit(container.querySelector("form")!);
    const link = screen.getByRole("link", { name: "Otwórz wiadomość w poczcie" });
    const url = new URL(link.getAttribute("href")!);
    expect(url.pathname).toBe("support@cvunfold.com");
    expect(url.searchParams.get("subject")).toBe("CVUnfold dla szkół: Demo & React");
    expect(url.searchParams.get("body")).toContain("mentor@example.com");
    expect(url.searchParams.get("body")).toContain("Grupa juniorów.\nProszę o demo.");
    expect(screen.getByRole("status").textContent).toContain("Wyślij ją w swojej aplikacji pocztowej");
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  });

  it("clears an outdated message link after the sender changes a field", () => {
    const { container } = render(<SchoolContactForm/>);
    fireEvent.change(screen.getByLabelText("Imię i nazwisko"), { target: { value: "Test Mentor" } });
    fireEvent.change(screen.getByLabelText("Służbowy e-mail"), { target: { value: "mentor@example.com" } });
    fireEvent.change(screen.getByLabelText("Szkoła lub bootcamp"), { target: { value: "Szkoła testowa" } });
    fireEvent.change(screen.getByLabelText("Wiadomość (opcjonalnie)"), { target: { value: "Proszę o demo" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("link", { name: "Otwórz wiadomość w poczcie" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Wiadomość (opcjonalnie)"), { target: { value: "Nowa treść" } });
    expect(screen.queryByRole("link", { name: "Otwórz wiadomość w poczcie" })).toBeNull();
  });
});
