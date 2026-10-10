import { describe, expect, it } from "vitest";
import { buildRevisionBrief, auditEvidenceReuse } from "@/lib/ai/report-brief";
import { createMockReport } from "@/lib/ai/mock-report";
import { getRubric } from "@/lib/rubrics/technical-v1";
import { calculateOverall } from "@/lib/ai/validate-report";

describe("first-job weights", () => {
  it("limits the cost of undocumented cooperation and keeps junior separate", () => {
    const weights = getRubric("first_job");
    expect(weights.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1);
    expect(weights.find(c => c.key === "collaboration")!.weight).toBe(.05);
    expect(getRubric("junior").find(c => c.key === "collaboration")!.weight).toBe(.17);
    const scores = weights.map(c => ({ ...c, score: c.key === "collaboration" ? 20 : 100, rationale: "", evidenceRefs: [] }));
    expect(calculateOverall(scores)).toBe(96);
  });
});

describe("revision summary", () => {
  it.each(["pl", "en"] as const)("uses prioritized existing actions and factuality guardrails (%s)", locale => {
    const report = createMockReport("first_job", false, "frontend_developer", locale);
    const text = buildRevisionBrief(report, locale);
    expect(text).toContain(report.nextSteps[0].action);
    expect(text).not.toContain("first_job");
    expect(text).toContain(locale === "pl" ? "Zatrzymaj się i zaczekaj" : "Stop and wait");
    expect(text).not.toContain(Object.values(report.evidenceMap!)[0]);
    expect(text).not.toContain("overallScore");
  });
  it("does not invent work for a report with no recommendations", () => {
    const report = createMockReport("first_job"); report.nextSteps = [];
    expect(buildRevisionBrief(report, "pl")).toContain("Brak priorytetowych zmian");
  });
  it.each(["pl", "en"] as const)("asks before editing and never supplies answers (%s)", locale => {
    const report = createMockReport("first_job", false, "frontend_developer", locale);
    const text = buildRevisionBrief(report, locale);
    const questions = text.indexOf(locale === "pl" ? "1. PYTANIA" : "1. QUESTIONS");
    const answers = text.indexOf(locale === "pl" ? "2. ODPOWIEDZI" : "2. ANSWERS");
    const edits = text.indexOf(locale === "pl" ? "3. POPRAWKI" : "3. EDITS");
    expect(questions).toBeGreaterThan(-1);
    expect(answers).toBeGreaterThan(questions);
    expect(edits).toBeGreaterThan(answers);
    expect(text).toContain(locale === "pl" ? "bez poprawionej wersji CV" : "without a rewritten CV");
    expect(text).toContain(locale === "pl" ? "Nie twórz przykładowych odpowiedzi za mnie" : "Do not produce sample answers on my behalf");
    expect(text).toContain(locale === "pl" ? "nie robiłem tego" : "I did not do that");
    expect(text).toContain(locale === "pl" ? "nie pamiętam" : "I do not remember");
    expect(text).toContain(locale === "pl" ? "wskaż, która odpowiedź" : "identify the answer");
  });
  it("does not impose gap questions when there are no recommendations", () => {
    const report = createMockReport("first_job"); report.nextSteps = [];
    const text = buildRevisionBrief(report, "en");
    expect(text).not.toContain("1. QUESTIONS");
    expect(text).toContain("do not invent problems or questions");
  });
  it("flags reuse for review without arbitrarily penalizing a multifaceted segment", () => {
    const report = createMockReport("first_job");
    report.categoryScores.forEach(c => { c.evidenceRefs = ["seg_shared", "seg_shared"]; });
    const previous = structuredClone(report.categoryScores);
    expect(auditEvidenceReuse(report)[0].categories).toHaveLength(6);
    expect(report.categoryScores).toEqual(previous);
  });
});
