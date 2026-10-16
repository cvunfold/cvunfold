import { expect, it } from "vitest";
import { validateAssessment, scoreAssessment, lockAssessment, type EvidenceAssessment } from "@/lib/ai/evidence-assessment";
import { RUBRIC_CATEGORY_KEYS } from "@/lib/ai/schemas/report";
import { createAiRoleSample } from "@/lib/ai/ai-role-samples";
import { TARGET_ROLES } from "@/lib/roles";
import { SENIORITIES } from "@/lib/rubrics/technical-v1";
import { resolveEvaluationStage } from "@/lib/ai/prompts";
const segments = [{ id: "seg_0", text: "Independently built a local API and checked validation." }];
export function assessment(count = 5): EvidenceAssessment {
  const evidence = [{ ref: "seg_0", quote: segments[0].text }];
  return { profile: { perceivedRole: "Backend Developer", perceivedSeniority: "junior", scope: "educational_project", confidence: "high", evidence: [{ ref: "seg_0", quote: segments[0].text }] }, evaluatedStage: "first_job", categories: RUBRIC_CATEGORY_KEYS.map(key => ({ key, signals: Array.from({ length: 5 }, (_, index) => ({ satisfied: index < count, evidence: index < count ? evidence : [] })) })), concerns: [] };
}
it("rejects invented quotations, absent refs and signal/evidence contradictions", () => {
  const input = assessment();
  expect(validateAssessment(input, segments, "first_job")).toEqual(input);
  input.categories[0].signals[0].evidence[0].quote = "Trained a model.";
  expect(() => validateAssessment(input, segments)).toThrow("ASSESSMENT_QUOTE_INVALID");
  input.categories[0].signals[0].evidence = [];
  expect(() => validateAssessment(input, segments)).toThrow("ASSESSMENT_EVIDENCE_REQUIRED");
});
it("does not silently substitute seniority or use an unsupported profile level", () => {
  const input = assessment();
  input.profile.evidence = [];
  expect(() => validateAssessment(input, segments)).toThrow("ASSESSMENT_LEVEL_EVIDENCE_REQUIRED");
  input.profile.evidence = [{ ref: "seg_0", quote: segments[0].text }];
  expect(() => validateAssessment(input, segments, "senior")).toThrow("ASSESSMENT_STAGE_MISMATCH");
  input.evaluatedStage = "junior";
  expect(validateAssessment(input, segments, "auto").evaluatedStage).toBe("junior");
});
it("preserves material concerns by reducing points instead of hiding severity", () => {
  const input = assessment(5);
  input.concerns = [{ id: "risk", category: "credibility", severity: "critical", confidence: "high", kind: "evidence", diagnosticKind: "other", summary: "Explicit contradictory statement", evidence: [{ ref: "seg_0", quote: segments[0].text }], verificationEvidence: [] }];
  const locked = scoreAssessment(input, "ai_llm_engineer", "first_job", "en", "first_job");
  expect(locked.categoryScores.find(category => category.key === "credibility")?.score).toBe(71);
  expect(locked.concerns[0].severity).toBe("critical");
  expect(locked.simulatedDecision).toBe("maybe");
});
it("keeps numeric scoring independent of report language across every role, stage and context", () => {
  for (const role of TARGET_ROLES) for (const stage of SENIORITIES) for (const context of ["standard", "first_job"] as const) {
    const input = assessment();
    input.evaluatedStage = resolveEvaluationStage(stage, context);
    input.categories.forEach((category, index) => { category.signals = assessment(index % 6).categories[0].signals; });
    const pl = scoreAssessment(input, role.id, stage, "pl", context);
    const en = scoreAssessment(input, role.id, stage, "en", context);
    expect(pl.overallScore).toBe(en.overallScore);
    expect(pl.categoryScores.map(category => [category.key, category.score, category.weight])).toEqual(en.categoryScores.map(category => [category.key, category.score, category.weight]));
    expect(pl.simulatedDecision).toBe(en.simulatedDecision);
  }
});
it("derives document level and auto weights from scope instead of trusting a supplied title", () => {
  const scopes = { unclear: "unclear", educational_project: "junior", supported_tasks: "junior", independent_delivery: "mid", area_tradeoffs: "senior", direction_through_others: "lead" } as const;
  for (const [scope, level] of Object.entries(scopes)) {
    const input = assessment();
    input.profile.scope = scope as EvidenceAssessment["profile"]["scope"];
    input.profile.perceivedSeniority = "lead";
    input.evaluatedStage = level === "unclear" ? "auto" : level as EvidenceAssessment["evaluatedStage"];
    expect(validateAssessment(input, segments, "auto").profile.perceivedSeniority).toBe(level);
  }
});
it("requires the strong-evidence anchor for strong reception rather than treating partial practice as strong", () => {
  expect(scoreAssessment(assessment(3), "ai_automation_specialist", "first_job", "en", "first_job")).toMatchObject({ overallScore: 68, simulatedDecision: "maybe" });
  expect(scoreAssessment(assessment(4), "ai_automation_specialist", "first_job", "en", "first_job")).toMatchObject({ overallScore: 84, simulatedDecision: "interview" });
});
it("does not equate a strong educational CV with evidence for a higher target stage", () => {
  const input = assessment();
  input.evaluatedStage = "senior";
  const senior = scoreAssessment(input, "frontend_developer", "senior", "en", "standard");
  expect(senior.overallScore).toBe(100);
  expect(senior.simulatedDecision).toBe("maybe");
  input.evaluatedStage = "auto";
  input.profile.perceivedSeniority = "unclear";
  expect(scoreAssessment(input, "frontend_developer", "auto", "en", "standard").simulatedDecision).toBe("maybe");
});
it("locks report judgments and rejects unassessed or missing issues", () => {
  const report = createAiRoleSample("ai_llm_engineer", "en");
  const locked = scoreAssessment(assessment(), "ai_llm_engineer", "first_job", "en", "first_job");
  expect(() => lockAssessment(report, locked)).toThrow("REPORT_UNASSESSED_ISSUE");
  report.issues = []; report.nextSteps = [];
  report.summary.overallScore = 37; report.document.perceivedSeniority = "lead";
  const result = lockAssessment(report, locked);
  expect(result.summary.overallScore).toBe(100);
  expect(result.document.perceivedSeniority).toBe("junior");
  expect(result.categoryScores.every(category => category.score === 100)).toBe(true);
});
it("validates a cited omission but does not present it as proof of a gap", () => {
  const input = assessment();
  input.concerns = [{ id: "gap", category: "ownership", severity: "important", confidence: "high", kind: "gap", diagnosticKind: "other", summary: "Missing visible scope", evidence: [{ ref: "seg_0", quote: segments[0].text }], verificationEvidence: [] }];
  const result = validateAssessment(input, segments, "first_job");
  expect(result.concerns[0].evidence).toEqual([]);
  input.concerns[0].evidence[0].quote = "Invented omission.";
  expect(() => validateAssessment(input, segments)).toThrow("ASSESSMENT_QUOTE_INVALID");
});
