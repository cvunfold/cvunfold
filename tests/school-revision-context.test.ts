// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createMockReport } from "@/lib/ai/mock-report";
import { schoolRevisionQuestions } from "@/lib/schools/revision-questions";
import { applySchoolAnswerContext, findSchoolAnswer, saveSchoolAnswers, schoolAnswerMethod } from "@/lib/schools/revision-context";
import { readSchoolAnswerHistory, writeSchoolAnswerHistory, clearSchoolAnswerHistory } from "@/lib/client/school-revision-answers";

afterEach(() => sessionStorage.clear());
function sample(id = "checks-before", project = "sklepu i aplikacji pogodowej") {
  const report = createMockReport("first_job", false, "frontend_developer", "pl");
  report.evidenceMap = { seg_0: project };
  report.issues = [{ id, category: "credibility", severity: "important", diagnosticKind: "missing_verification", title: "Sprawdzenia", explanation: `CV nie podaje sprawdzeń ${project}.`, whyItMatters: "Praktyka wymaga sprawdzeń.", evidenceRefs: [], confidence: "high", action: `Ustal, jakie sprawdzenia wykonano dla ${project}.`, suggestion: { type: "question", original: null, proposed: null, factualityNote: "Ustal fakty." } }];
  report.nextSteps = [{ issueId: id, priority: 1, title: "Sprawdzenia", action: report.issues[0].action, expectedImpact: "high" }];
  return report;
}
describe("school iteration answer context", () => {
  it("recognizes a answered topic after issue IDs change without changing grades", () => {
    const before = sample(), method = schoolAnswerMethod(before);
    const saved = saveSchoolAnswers(before, 0, method, { "checks-before": { status: "not_done", text: "Discarded fabricated test" } }, []);
    const after = sample("checks-after");
    expect(findSchoolAnswer(after, schoolRevisionQuestions(after)[0], 1, method, saved)?.answer).toEqual({ status: "not_done", text: "" });
    const shown = applySchoolAnswerContext(after, 1, method, saved);
    expect(shown.issues[0].action).toContain("Najpierw rzeczywiście sprawdź");
    expect(shown.nextSteps[0].action).toBe(shown.issues[0].action);
    expect(shown.summary).toEqual(after.summary); expect(shown.categoryScores).toEqual(after.categoryScores);
    expect(after.issues[0].action).toContain("Ustal");
    const moved = sample("moved-checks"); moved.issues[0].category = "impact";
    expect(findSchoolAnswer(moved, schoolRevisionQuestions(moved)[0], 1, method, saved)?.answer.status).toBe("not_done");
  });
  it("does not close another project's question, a changed method or a previous version", () => {
    const report = sample(), method = schoolAnswerMethod(report);
    const saved = saveSchoolAnswers(report, 1, method, { "checks-before": { status: "not_done", text: "" } }, []);
    const foreign = sample("another", "TrackBuddy z harmonogramem kalendarza");
    expect(findSchoolAnswer(foreign, schoolRevisionQuestions(foreign)[0], 2, method, saved)).toBeUndefined();
    expect(findSchoolAnswer(report, schoolRevisionQuestions(report)[0], 2, "another-method", saved)).toBeUndefined();
    expect(findSchoolAnswer(report, schoolRevisionQuestions(report)[0], 0, method, saved)).toBeUndefined();
  });
  it("requires an unambiguous match when several projects have the same diagnosis", () => {
    const report = sample(), method = schoolAnswerMethod(report);
    const saved = saveSchoolAnswers(report, 0, method, { "checks-before": { status: "not_done", text: "" } }, []);
    const after = sample("checks-after");
    expect(findSchoolAnswer(after, schoolRevisionQuestions(after)[0], 1, method, [...saved, { ...saved[0], question: { ...saved[0].question, id: "other-project" } }])).toBeUndefined();
  });
  it("reuses distinct ownership answers when a later report merges their topics", () => {
    const before = sample();
    before.evidenceMap = { seg_0: "Sklep tutorial kolory produkty. Aplikacja pogodowa pobiera temperaturę." };
    const base = before.issues[0];
    before.issues = [
      { ...base, id: "shop", category: "ownership", diagnosticKind: "limited_contribution", title: "Sklep", action: "Ustal zakres sklepu i tutorialu.", explanation: "Sklep tutorial kolory produkty." },
      { ...base, id: "weather", category: "ownership", diagnosticKind: "unattributed_contribution", title: "Pogodowa", action: "Ustal autorstwo aplikacji pogodowej i pobierania temperatury.", explanation: "Aplikacja pogodowa pobiera temperaturę." },
    ];
    before.nextSteps = before.issues.map((issue, index) => ({ issueId: issue.id, priority: index + 1, title: issue.title, action: issue.action, expectedImpact: "high" as const }));
    const method = schoolAnswerMethod(before);
    const saved = saveSchoolAnswers(before, 0, method, { shop: { status: "confirmed", text: "Zmieniłem kolory." }, weather: { status: "unknown", text: "" } }, []);
    const after = structuredClone(before);
    after.issues = [{ ...before.issues[0], id: "merged", title: "Sklep i pogodowa", action: "Ustal zakres sklepu i aplikacji pogodowej.", explanation: "Sklep tutorial kolory produkty. Aplikacja pogodowa pobiera temperaturę." }];
    after.nextSteps = [{ issueId: "merged", priority: 1, title: "Zakres", action: after.issues[0].action, expectedImpact: "high" }];
    expect(findSchoolAnswer(after, schoolRevisionQuestions(after)[0], 1, method, saved)?.answer).toEqual({ status: "unknown", text: "" });
    const changed = structuredClone(after); changed.evidenceMap!.seg_1 = "TrackBuddy harmonogram kalendarza"; changed.issues[0].action += " TrackBuddy harmonogram kalendarza.";
    expect(findSchoolAnswer(changed, schoolRevisionQuestions(changed)[0], 1, method, saved)).toBeUndefined();
  });
  it("retains session answers across reads, separates accounts/students and removes expired records", () => {
    const report = sample(), method = schoolAnswerMethod(report);
    const saved = saveSchoolAnswers(report, 0, method, { "checks-before": { status: "unknown", text: "" } }, []);
    writeSchoolAnswerHistory("account-a:student-a", "student-a", new Date(Date.now() + 60000).toISOString(), saved);
    expect(readSchoolAnswerHistory("account-a:student-a", "student-a")).toEqual(saved);
    expect(readSchoolAnswerHistory("account-b:student-a", "student-a")).toEqual([]);
    expect(readSchoolAnswerHistory("account-a:student-a", "student-b")).toEqual([]);
    expect(() => writeSchoolAnswerHistory("expired", "student-a", new Date(0).toISOString(), saved)).toThrow();
    writeSchoolAnswerHistory("account-a:student-a", "student-a", new Date(Date.now() + 60000).toISOString(), saved);
    clearSchoolAnswerHistory("student-a"); expect(readSchoolAnswerHistory("account-a:student-a", "student-a")).toEqual([]);
  });
});
