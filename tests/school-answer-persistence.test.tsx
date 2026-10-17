// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SchoolPanel } from "@/components/schools/school-panel";
import { createMockReport } from "@/lib/ai/mock-report";
import type { SchoolData } from "@/lib/schools/model";

afterEach(() => { cleanup(); sessionStorage.clear(); });
function report(id: string) {
  const r = createMockReport("first_job", false, "frontend_developer", "pl");
  r.evidenceMap = { seg_0: "Sklep i aplikacja pogodowa." };
  r.issues = [{ id, category: "credibility", severity: "important", diagnosticKind: "missing_verification", title: "Sprawdzenia projektów", explanation: "Brak opisu sprawdzeń sklepu i aplikacji pogodowej.", whyItMatters: "Praktyka wymaga sprawdzeń.", evidenceRefs: [], confidence: "high", action: "Ustal, jakie sprawdzenia wykonano dla sklepu i aplikacji pogodowej.", suggestion: { type: "question", original: null, proposed: null, factualityNote: "Ustal fakty." } }];
  r.nextSteps = [{ issueId: id, priority: 1, title: "Sprawdzenia projektów", action: r.issues[0].action, expectedImpact: "high" }];
  return r;
}
const before = report("before-checks"), after = report("after-checks");
const data: SchoolData = { schoolName: "Fikcyjna szkoła", groupId: "test-session-group", groups: [], students: ["Michał", "Anna"].map((name, index) => ({ id: `synthetic-${index}`, name, paid: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(), report: after, initialReport: before, latestVersion: 1,
  sample: { title: "Test", description: "Fikcyjny przykład", sourceText: "Sklep i aplikacja pogodowa.", sourceUrl: "/demo/test-before.pdf", analyzedAt: new Date().toISOString(), revision: { createdAt: new Date().toISOString(), sourceUrl: "/demo/test-after.pdf", sourceText: "Sklep i aplikacja pogodowa.", changes: [], analysis: { before, after, beforeCreatedAt: new Date().toISOString(), afterCreatedAt: new Date().toISOString() } } } })) };

it("retains reviewed answers through version changes and remount, without leaking to another student", async () => {
  async function selectVersion(name: RegExp) {
    const button = screen.getByRole("button", { name }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("button", { name }).getAttribute("aria-pressed")).toBe("true"));
    await waitFor(() => expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(false));
  }
  const first = render(<SchoolPanel initialData={data} demo/>);
  fireEvent.click(screen.getAllByRole("button", { name: /^Raport/ })[0]);
  await selectVersion(/Pierwsza analiza/);
  fireEvent.click(screen.getByRole("combobox", { name: "Sposób odpowiedzi 1" }));
  fireEvent.click(screen.getByRole("option", { name: "Nie robiłem tego" }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Odpowiedzi pochodzą/ }));
  fireEvent.click(screen.getByRole("button", { name: "Zapisz sprawdzone odpowiedzi" }));
  expect(screen.queryByLabelText("Sposób odpowiedzi 1")).toBeNull();
  await selectVersion(/Po poprawkach 1/);
  expect(screen.queryByLabelText("Sposób odpowiedzi 1")).toBeNull();
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Pytania przed poprawą CV" })).toBeNull());
  expect(screen.getAllByText(/Najpierw rzeczywiście sprawdź/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Wróć do grupy" }));
  fireEvent.click(screen.getAllByRole("button", { name: /^Raport/ })[1]);
  await selectVersion(/Pierwsza analiza/);
  expect(await screen.findByRole("combobox", { name: "Sposób odpowiedzi 1" })).toBeTruthy();
  first.unmount();
  render(<SchoolPanel initialData={data} demo/>);
  fireEvent.click(screen.getAllByRole("button", { name: /^Raport/ })[0]);
  expect(screen.queryByLabelText("Sposób odpowiedzi 1")).toBeNull();
  await selectVersion(/Pierwsza analiza/);
  expect(screen.getByText(/Nie zadajemy ich ponownie/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Zmień odpowiedź:/ }));
  expect(screen.getByRole("combobox", { name: "Sposób odpowiedzi 1" }).textContent).toContain("Nie robiłem tego");
  expect((screen.getByRole("button", { name: "Zapisz sprawdzone odpowiedzi" }) as HTMLButtonElement).disabled).toBe(true);
});
