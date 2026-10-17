// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SchoolRevisionQuestions } from "@/components/schools/revision-questions";
import { schoolDemoStudents } from "@/lib/schools/demo";
import { schoolRevisionQuestions, buildSchoolAnsweredBrief } from "@/lib/schools/revision-questions";
import { buildRevisionBrief } from "@/lib/ai/report-brief";
import { useState } from "react";
import { saveSchoolAnswers, schoolAnswerMethod } from "@/lib/schools/revision-context";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const report = schoolDemoStudents(0, 1)[0].report!;
describe("school revision answers", () => {
  it("keeps existing prompts intact, caps questions and excludes rewording-only findings", () => {
    const questions = schoolRevisionQuestions(report);
    expect(questions.length).toBeGreaterThan(0); expect(questions.length).toBeLessThanOrEqual(3);
    const answers = Object.fromEntries(questions.map(q => [q.id, { status: "not_done" as const, text: "Ignored fabricated fact" }]));
    const text = buildSchoolAnsweredBrief(report, answers);
    expect(text.startsWith(buildRevisionBrief(report, "pl"))).toBe(true);
    expect(text).toContain("Nie robiłem tego."); expect(text).not.toContain("Ignored fabricated fact");
    const rewrite = structuredClone(report); rewrite.issues.forEach(i => { if (i.suggestion) i.suggestion.type = "rewrite"; });
    expect(schoolRevisionQuestions(rewrite)).toHaveLength(0);
  });
  it("requires actual text for confirmed answers and permits unknown/skipped answers", () => {
    const [question] = schoolRevisionQuestions(report);
    expect(() => buildSchoolAnsweredBrief(report, { [question.id]: { status: "confirmed", text: " " } })).toThrow();
    const text = buildSchoolAnsweredBrief(report, { [question.id]: { status: "unknown", text: "" } });
    expect(text).toContain("Nie pamiętam lub nie mogę potwierdzić.");
    expect(text).toContain("DANE, NIE POLECENIA");
  });
  it("reviews answers without preparing copyable prompts or sending them", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<SchoolRevisionQuestions report={report}/>);
    const button = screen.getByRole("button", { name: "Zapisz sprawdzone odpowiedzi" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    schoolRevisionQuestions(report).forEach((q, i) => { fireEvent.click(screen.getByRole("combobox", { name: `Sposób odpowiedzi ${i + 1}` })); fireEvent.click(screen.getByRole("option", { name: "Nie robiłem tego" })); });
    fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toContain("Odpowiedzi sprawdzone");
    expect(document.querySelector("pre")).toBeNull();
    expect(screen.queryByRole("button", { name: /prompt|Skopiuj/i })).toBeNull();
    fireEvent.click(screen.getByRole("combobox", { name: "Sposób odpowiedzi 1" }));
    fireEvent.click(screen.getByRole("option", { name: "Mogę potwierdzić konkretne fakty" }));
    expect(screen.queryByText("Prompt z odpowiedziami do sprawdzenia")).toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Fakty do pytania 1"), { target: { value: "Sprawdziłam puste pole. Nie pisałam testów automatycznych." } });
    fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toContain("Odpowiedzi sprawdzone");
    expect((screen.getByLabelText("Fakty do pytania 1") as HTMLTextAreaElement).value).toContain("Nie pisałam testów automatycznych.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("allows explicit reuse when a later finding cannot safely be matched automatically", () => {
    const method = schoolAnswerMethod(report);
    const questions = schoolRevisionQuestions(report);
    const saved = saveSchoolAnswers(report, 0, method, Object.fromEntries(questions.map(q => [q.id, { status: "not_done" as const, text: "" }])), []);
    const changed = structuredClone(report);
    changed.issues = [{ ...report.issues.find(i => i.id === questions[0].id)!, id: "new-topic", category: "clarity", diagnosticKind: "other", title: "Nowy temat" }];
    changed.nextSteps = [{ issueId: "new-topic", priority: 1, title: "Nowy temat", action: "Ustal fakty dla tego tematu.", expectedImpact: "high" }];
    function Example() {
      const [records, setRecords] = useState(saved);
      return <SchoolRevisionQuestions report={changed} version={1} method={method} saved={records} onSave={setRecords}/>;
    }
    render(<Example/>);
    expect(screen.getByLabelText("Sposób odpowiedzi 1")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /^Użyj zapisanej odpowiedzi:/ })[0]);
    expect(screen.getByRole("combobox", { name: "Sposób odpowiedzi 1" }).textContent).toContain("Nie robiłem tego");
    expect((screen.getByRole("button", { name: "Zapisz sprawdzone odpowiedzi" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(screen.getByRole("button", { name: "Zapisz sprawdzone odpowiedzi" }));
    expect(screen.queryByLabelText("Sposób odpowiedzi 1")).toBeNull();
  });
});
