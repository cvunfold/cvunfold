import { expect, it } from "vitest";
import { scoreAssessment, type EvidenceAssessment } from "@/lib/ai/evidence-assessment";
import { auditCalibration } from "@/lib/ai/validate-report";
import { RUBRIC_VERSION, SENIORITIES } from "@/lib/rubrics/technical-v1";
import { SCORE_THRESHOLDS, scoreEvidenceSignals } from "@/lib/rubrics/score-scale";
import { TARGET_ROLES } from "@/lib/roles";
import { RUBRIC_CATEGORY_KEYS } from "@/lib/ai/schemas/report";
import { resolveEvaluationStage } from "@/lib/ai/prompts";
import { scoreBand } from "@/components/score-ring";

function completeAssessment(stage: EvidenceAssessment["evaluatedStage"]): EvidenceAssessment {
  const evidence = [{ ref: "seg_0", quote: "Delivered a documented project." }];
  return {
    profile: { perceivedRole: "Developer", perceivedSeniority: "junior", scope: "educational_project", confidence: "high", evidence },
    evaluatedStage: stage,
    categories: RUBRIC_CATEGORY_KEYS.map(key => ({ key, signals: Array.from({ length: 5 }, () => ({ satisfied: true, evidence })) })),
    concerns: [],
  };
}

it("makes full evidence reach 100 in every role, stage, context and output language", () => {
  expect(RUBRIC_VERSION).toBe("technical-v2.2.0");
  for (const role of TARGET_ROLES) for (const stage of SENIORITIES) for (const context of ["standard", "first_job"] as const) for (const locale of ["pl", "en"] as const) {
    const result = scoreAssessment(completeAssessment(resolveEvaluationStage(stage, context)), role.id, stage, locale, context);
    expect(result.overallScore).toBe(100);
    expect(result.categoryScores.every(category => category.score === 100)).toBe(true);
  }
});

it("preserves the missing-information baseline and rescales all interpretation boundaries", () => {
  expect(Array.from({ length: 6 }, (_, count) => scoreEvidenceSignals(count))).toEqual([20, 36, 52, 68, 84, 100]);
  expect(SCORE_THRESHOLDS).toEqual({ strong: 84, provisional: 43, importantCap: 87, criticalCap: 71, schoolRefinement: 66, schoolMinor: 89 });
  expect(() => scoreEvidenceSignals(6)).toThrow("INVALID_SIGNAL_COUNT");
  expect(() => scoreEvidenceSignals(-1)).toThrow("INVALID_SIGNAL_COUNT");
});

it("applies the new provisional boundary without changing the higher-stage scope guard", () => {
  const input = completeAssessment("first_job");
  input.categories.forEach(category => {
    const count = category.key === "credibility" ? 4 : 0;
    category.signals.forEach((signal, index) => { signal.satisfied = index < count; signal.evidence = signal.satisfied ? input.profile.evidence : []; });
  });
  expect(scoreAssessment(input, "frontend_developer", "first_job", "pl", "first_job")).toMatchObject({ overallScore: 42, simulatedDecision: "reject" });
  input.categories.find(category => category.key === "architecture")!.signals[0] = { satisfied: true, evidence: input.profile.evidence };
  expect(scoreAssessment(input, "frontend_developer", "first_job", "pl", "first_job")).toMatchObject({ overallScore: 43, simulatedDecision: "maybe" });
});

it("keeps localized score captions aligned with the saved report's scale", () => {
  for (const [oldScore, newScore, tone] of [[40, 43, "weak"], [55, 60, "mixed"], [70, 77, "good"], [85, 94, "strong"]] as const) {
    expect(scoreBand(oldScore, "technical-v2.1.2").tone).toBe(tone);
    expect(scoreBand(newScore, RUBRIC_VERSION).tone).toBe(tone);
    expect(scoreBand(newScore - 1, RUBRIC_VERSION).tone).not.toBe(tone);
  }
  expect(scoreBand(100, RUBRIC_VERSION)).toMatchObject({ tone: "strong", pl: "Mocny dokument", en: "Strong document" });
});

it("caps material concerns and audits them according to the stored rubric version", () => {
  for (const [severity, cap] of [["important", 87], ["critical", 71]] as const) {
    const input = completeAssessment("first_job");
    input.concerns = [{ id: "risk", category: "ownership", severity, confidence: "high", kind: "gap", diagnosticKind: "other", summary: "Unclear personal scope", evidence: [], verificationEvidence: [] }];
    const locked = scoreAssessment(input, "frontend_developer", "first_job", "pl", "first_job");
    expect(locked.categoryScores.find(category => category.key === "ownership")!.score).toBe(cap);
    const issues = [{ ...input.concerns[0], title: "", explanation: "", whyItMatters: "", action: "", evidenceRefs: [], suggestion: null }];
    expect(auditCalibration({ rubricVersion: RUBRIC_VERSION, categoryScores: locked.categoryScores, issues })).toEqual([]);
    const categoryScores = locked.categoryScores.map(category => ({ ...category, score: category.key === "ownership" ? cap + 1 : category.score }));
    expect(auditCalibration({ rubricVersion: RUBRIC_VERSION, categoryScores, issues })).toEqual([{ category: "ownership", score: cap + 1, severity, cap }]);
    expect(auditCalibration({ rubricVersion: "technical-v2.1.2", categoryScores: locked.categoryScores, issues })[0].cap).toBe(severity === "important" ? 79 : 65);
  }
});
