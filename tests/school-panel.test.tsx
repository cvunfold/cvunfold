import { SCHOOL_DEMO_PREVIEW_IMAGES } from "@/lib/schools/demo-preview-images";
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolPanel } from "@/components/schools/school-panel";
import { schoolDemoData, schoolDemoStudents, schoolIterationDemoData, schoolGuidedIterationsData } from "@/lib/schools/demo";
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("public school demo", () => {
  it("switches between real paired reports and demo groups without APIs or duplicate students", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const data = schoolIterationDemoData();
    const pair = data.students[0].sample!.revision!.analysis!;
    render(<SchoolPanel initialData={schoolDemoData()} demoGroups={[schoolDemoData(), data]} demo/>);
    fireEvent.click(screen.getByRole("button", { name: "Zobacz iterację Anny" }));
    expect(document.querySelectorAll(".school-student").length).toBe(1);
    expect(document.querySelector(".school-progress")?.textContent).toContain(`${pair.before.summary.overallScore}/100 → ${pair.after.summary.overallScore}/100`);
    fireEvent.click(screen.getByRole("button", { name: "Raport" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Po poprawkach 1/ }).getAttribute("aria-pressed")).toBe("true"));
    expect(screen.getByRole("heading", { name: "Perspektywa rekrutera" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Co zmieniło się po poprawkach?" })).toBeTruthy();
    expect(document.querySelectorAll(".school-finding").length).toBe(pair.after.issues.length + data.students[0].sample!.revision!.changes.length);
    fireEvent.click(screen.getByRole("button", { name: /Pierwsza analiza/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Pierwsza analiza/ }).getAttribute("aria-pressed")).toBe("true"));
    expect(document.querySelectorAll(".school-finding").length).toBe(pair.before.issues.length + data.students[0].sample!.revision!.changes.length);
    expect(document.querySelectorAll(".school-feedback").length).toBe(1);
    expect(screen.queryByRole("heading", { name: "Proponowany zapis" })).toBeNull();
    expect(screen.queryByText("Zobacz prompt z odpowiedziami użyty do poprawy")).toBeNull();
    expect(screen.getByText(/To historyczny przykład poprawki/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Jak samodzielnie poprawić CV" })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("shows guided before/after histories and their answers without copyable prompts", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const data = schoolGuidedIterationsData();
    render(<SchoolPanel initialData={data} demoGroups={[data, schoolDemoData(), schoolIterationDemoData()]} demo/>);
    expect(document.querySelectorAll(".school-student")).toHaveLength(data.students.length);
    for (const student of data.students) {
      const before = screen.getByRole("link", { name: `Pobierz CV${student.sample!.revision ? " przed poprawkami" : ""}: ${student.name}` });
      expect(before.getAttribute("href")).toBe(student.sample!.sourceUrl);
      if (student.sample!.revision) {
        const after = screen.getByRole("link", { name: `Pobierz CV po poprawkach: ${student.name}` });
        expect(after.getAttribute("href")).toBe(student.sample!.revision.sourceUrl);
      } else {
        expect(screen.queryByRole("link", { name: `Pobierz CV po poprawkach: ${student.name}` })).toBeNull();
      }
    }
    expect(document.querySelector(".school-student-score")?.textContent).toContain(`${data.students[0].initialReport!.summary.overallScore} → ${data.students[0].report!.summary.overallScore}`);
    fireEvent.click(screen.getAllByRole("button", { name: "Raport" })[0]);
    expect(screen.queryByRole("heading", { name: "Pytania przed poprawą CV" })).toBeNull();
    expect(screen.getByText(/nie używaliśmy gotowego prompta do przepisywania CV/)).toBeTruthy();
    const source = document.querySelector("#school-source") as HTMLElement;
    expect(within(source).getByRole("link", { name: "Pobierz CV po poprawkach (PDF)" }).getAttribute("href")).toBe(data.students[0].sample!.revision!.sourceUrl);
    expect(within(source).queryByText("Pobierz CV w nowym szablonie")).toBeNull();
    fireEvent.click(within(source).getByRole("button", { name: "Pokaż podgląd PDF" }));
    expect(within(source).getByRole("img").getAttribute("src")).toBe(SCHOOL_DEMO_PREVIEW_IMAGES[data.students[0].sample!.revision!.sourceUrl]);
    expect(screen.queryByRole("button", { name: /Skopiuj prompt|Skopiuj podsumowanie/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Pierwsza analiza/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Pierwsza analiza/ }).getAttribute("aria-pressed")).toBe("true"));
    expect(screen.getByRole("heading", { name: "Pytania przed poprawą CV" })).toBeTruthy();
    expect(within(source).getByRole("link", { name: "Pobierz CV przed poprawkami (PDF)" }).getAttribute("href")).toBe(data.students[0].sample!.sourceUrl);
    fireEvent.click(screen.getByRole("button", { name: /Po poprawkach 1/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Po poprawkach 1/ }).getAttribute("aria-pressed")).toBe("true"));
    expect(screen.queryByRole("heading", { name: "Pytania przed poprawą CV" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Wróć do grupy" }));
    fireEvent.click(screen.getByRole("button", { name: "Zobacz archiwalne CV" }));
    expect(document.querySelectorAll(".school-student")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Zobacz poprawki grupy" }));
    expect(document.querySelectorAll(".school-student")).toHaveLength(data.students.length);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("opens the selected student's feedback editor from the email popover", () => {
    const scrollIntoView = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: scrollIntoView, configurable: true });
    render(<SchoolPanel initialData={schoolDemoData()} demo/>);
    fireEvent.click(screen.getByRole("button", { name: "E-mail: Julia Wiśniewska" }));
    fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail z poprawkami" }));
    expect(screen.getByRole("heading", { name: "Julia Wiśniewska" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zwiń edytor" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("textbox", { name: "Temat" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Adresat" }).textContent).toContain("kursant3@example.com");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Feedback do skopiowania" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Treść maila" }), { target: { value: "Moja rozpoczęta wiadomość" } });
    fireEvent.click(screen.getByRole("button", { name: "Zwiń edytor" }));
    fireEvent.click(screen.getByRole("button", { name: "E-mail: Julia Wiśniewska" }));
    fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail z poprawkami" }));
    expect((screen.getByRole("textbox", { name: "Treść maila" }) as HTMLTextAreaElement).value).toBe("Moja rozpoczęta wiadomość");
  });
  it("retains source quotations and shows a decorative quote icon on each block", () => {
    render(<SchoolPanel initialData={schoolDemoData()} demo/>);
    fireEvent.click(screen.getAllByRole("button", { name: "Raport" })[0]);
    const quotes = document.querySelectorAll("blockquote");
    expect(quotes.length).toBeGreaterThan(0);
    for (const quote of quotes) {
      expect(quote.textContent?.trim().length).toBeGreaterThan(0);
      expect(quote.querySelector(".school-quote-icon")?.getAttribute("aria-hidden")).toBe("true");
    }
  });
  it("shows safe email/phone links in the student row and selected report", () => {
    const data = schoolDemoData();
    data.students[0].contact = { emails: ["anna+cv@example.com"], phones: [{ label: "+48 501 234 567", number: "+48501234567" }] };
    render(<SchoolPanel initialData={data} demo/>);
    fireEvent.click(screen.getByRole("button", { name: "E-mail: Anna Kowalska" }));
    expect(screen.getByRole("link", { name: "Wyślij" }).getAttribute("href")).toBe("mailto:anna%2Bcv%40example.com");
    fireEvent.click(screen.getByRole("button", { name: "Telefon: Anna Kowalska" }));
    expect(screen.getByRole("link", { name: "Zadzwoń" }).getAttribute("href")).toBe("tel:+48501234567");
    fireEvent.click(screen.getAllByRole("button", { name: "Raport" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "E-mail: Anna Kowalska" }));
    expect(screen.getByRole("link", { name: "Wyślij" })).toBeTruthy();
  });
  it("changes the displayed order and announces direction when clicking column headings", () => {
    render(<SchoolPanel initialData={schoolDemoData()} demo/>);
    const firstName = () => document.querySelector(".school-student strong")?.textContent;
    const nameButton = screen.getByRole("button", { name: "Imię i nazwisko" });
    fireEvent.click(nameButton);
    expect(firstName()).toBe("Adam Dąbrowski");
    expect(nameButton.closest("th")?.getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(nameButton);
    expect(firstName()).toBe("Zofia Wójcik");
    expect(nameButton.closest("th")?.getAttribute("aria-sort")).toBe("descending");
    fireEvent.click(screen.getByRole("button", { name: "Ocena" }));
    expect(firstName()).toBe("Natalia Lewandowska");
    fireEvent.click(screen.getByRole("button", { name: "Ocena" }));
    expect(firstName()).toBe("Michał Nowak");
  });
  it("switches reports, filters the group and adds synthetic CVs without API calls", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<SchoolPanel initialData={{ ...schoolDemoData(), students: schoolDemoStudents(0, 8) }} demo demoMore={schoolDemoStudents(8, 2)}/>);
    expect(screen.getByRole("heading", { name: "Kursanci (8)" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Raport" })[0]);
    expect(screen.getByRole("heading", { name: "Anna Kowalska" })).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: "Kursant" }));
    fireEvent.click(screen.getByRole("option", { name: "Julia Wiśniewska" }));
    expect(screen.getByRole("heading", { name: "Julia Wiśniewska" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Wróć do grupy" }));
    const problems = screen.getByRole("heading", { name: "Priorytety pracy z grupą" }).parentElement!;
    fireEvent.click(within(problems).getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: "Pokaż wszystkich" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pokaż wszystkich" }));
    fireEvent.click(screen.getByRole("button", { name: "Dodaj przykładową paczkę CV" }));
    expect(screen.getByRole("heading", { name: "Kursanci (10)" })).toBeTruthy();
    expect(document.querySelector('input[type="file"]')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});


it("keeps one feedback editor and resets its draft when switching report versions", async () => {
  window.history.replaceState({}, "", "/dla-szkol/panel");
  const data = schoolDemoData(); data.students = [data.students[0]]; data.students[0].sample = undefined;
  const first = data.students[0].report!; const latest = structuredClone(first); latest.summary.overallScore = 65;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.startsWith("/api/schools/reports/")) {
      const version = new URL(url, "http://localhost").searchParams.get("version") === "0" ? 0 : 1;
      return new Response(JSON.stringify({ paid: true, fullAccess: true, report: version ? latest : first, expiresAt: "2026-11-11", version, iterationsAvailable: true, rechecksRemaining: 0,
        revisions: [{ version: 0, score: 55, createdAt: "2026-10-11" }, { version: 1, score: 65, createdAt: "2026-10-12" }] }));
    }
    return new Response(JSON.stringify(data));
  }));
  render(<SchoolPanel initialData={data}/>);
  fireEvent.click(screen.getByRole("button", { name: "Raport" }));
  await waitFor(() => expect(screen.getByRole("button", { name: /Po poprawkach 1/ }).getAttribute("aria-pressed")).toBe("true"));
  fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Treść maila" }), { target: { value: "Draft for previous version" } });
  for (const version of [0, 1, 0, 1]) {
    const name = version === 0 ? /Pierwsza analiza/ : /Po poprawkach 1/;
    fireEvent.click(screen.getByRole("button", { name }));
    await waitFor(() => expect(screen.getByRole("button", { name }).getAttribute("aria-pressed")).toBe("true"));
    expect(screen.getAllByRole("region", { name: "Feedback do skopiowania" })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { name: "Czy ta wersja analizy była trafna?" })).toHaveLength(1);
    expect(screen.queryByDisplayValue("Draft for previous version")).toBeNull();
  }
});

it("uses invoice contact for schools without exposing an unavailable full report or checkout actions", async () => {
  window.history.replaceState({}, "", "/dla-szkol/panel");
  const data = schoolDemoData();
  data.students = [{ ...data.students[0], paid: false, report: null, sample: undefined }];
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ paid: false, fullAccess: false,
    report: { profileSummary: "Wynik wstępny", firstImpression: "Opis dokumentu", featuredIssue: null }, expiresAt: "2026-11-11" }))));
  render(<SchoolPanel initialData={data}/>);
  expect(screen.getByText(/Rozliczamy współpracę ze szkołą na podstawie faktury/)).toBeTruthy();
  expect(screen.queryByText(/299 zł/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Raport" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Dostęp do pełnego raportu" })).toBeTruthy());
  expect(screen.getByRole("link", { name: "Ustal dostęp dla szkoły" }).getAttribute("href")).toBe("/dla-szkol#kontakt");
  expect(screen.queryByRole("button", { name: /Odblokuj|Wybierz pakiet|Sprawdź status płatności/ })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Perspektywa rekrutera" })).toBeNull();
  expect(vi.mocked(fetch).mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
});
