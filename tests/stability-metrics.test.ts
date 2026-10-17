import { expect, it } from "vitest";
import { summarizeScoreStability, type ScoreObservation } from "@/lib/ai/stability-metrics";
const categories = (impact: number) => ({ impact, ownership: 62, credibility: 90, architecture: 76, collaboration: 62, clarity: 90 });
it("distinguishes paired-language agreement from unstable repeated scores", () => {
  const rows: ScoreObservation[] = [
    ...[82, 84, 75].map((score, index) => ({ id: "automation", locale: "pl" as const, repeat: index + 1, score, categories: categories([76, 90, 62][index]), decision: "interview", level: "junior" })),
    ...[82, 82, 82].map((score, index) => ({ id: "automation", locale: "en" as const, repeat: index + 1, score, categories: categories(76), decision: "interview", level: "junior" })),
  ];
  const metrics = summarizeScoreStability(rows);
  expect(metrics.localePairsPassed).toBe(3);
  expect(metrics.withinLanguagePassed).toBe(1);
  expect(metrics.withinLanguage.find(group => group.locale === "pl")).toMatchObject({ pass: false, overallSpread: 9, categorySpreads: { impact: 28 } });
});
it("does not call missing repeats or changing decisions stable", () => {
  const row: ScoreObservation = { id: "case", locale: "pl", repeat: 1, score: 65, categories: categories(76), decision: "interview", level: "junior" };
  expect(summarizeScoreStability([row]).withinLanguagePassed).toBe(0);
  expect(summarizeScoreStability([row, { ...row, repeat: 2 }, { ...row, repeat: 3, decision: "maybe" }]).withinLanguagePassed).toBe(0);
});

it("keeps one-signal tolerance equivalent after the scale expansion and still rejects two-signal drift", () => {
  const rows: ScoreObservation[] = ["pl", "en"].flatMap(locale => [1, 2, 3].map(repeat => ({
    id: "same-evidence", locale: locale as "pl" | "en", repeat, score: 92,
    categories: categories(locale === "pl" ? 84 : 100), decision: "interview", level: "junior", rubricVersion: "technical-v2.2.0",
  })));
  expect(summarizeScoreStability(rows).localePairsPassed).toBe(3);
  expect(summarizeScoreStability(rows).paired[0]).toMatchObject({ categoryDeltas: { impact: 16 }, evidenceUnitCategoryDeltas: { impact: 14 } });
  rows.filter(row => row.locale === "pl").forEach(row => { row.categories.impact = 68; });
  expect(summarizeScoreStability(rows).localePairsPassed).toBe(0);
});
