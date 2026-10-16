import { z } from "zod";
import type { Segment } from "@/lib/document-parsing";
import { getRubric, type Seniority, SENIORITIES } from "@/lib/rubrics/technical-v1";
import type { TargetRoleId } from "@/lib/roles";
import type { CareerContext } from "./career-context";
import type { Locale } from "@/lib/i18n";
import { RUBRIC_CATEGORY_KEYS, type CVReport } from "./schemas/report";
import { calculateOverall } from "./validate-report";
import { resolveEvaluationStage } from "./prompts";
import { SCORE_THRESHOLDS, scoreEvidenceSignals } from "@/lib/rubrics/score-scale";


export const ASSESSMENT_VERSION = "evidence-signals-v3.1.3";
export const ASSESSMENT_VALIDATION_VERSION = "source-quotes-v2.0.2";
// Four of five signals is the strong-evidence anchor (84), rather than a
// barely-above-three-signal score triggering a strong document reception.
export const STRONG_EVIDENCE_SCORE = SCORE_THRESHOLDS.strong;
const quote = z.object({
  ref: z.string().regex(/^seg_[a-z0-9_]+$/).describe("Copy the ID of the one source segment containing this exact quotation. Do not guess or reuse a neighboring segment ID."),
  quote: z.string().min(1).describe("Copy a contiguous substring from that segment EXACTLY in its original language. Preserve grammatical word forms, punctuation, numbers, names and negation. Do not paraphrase or translate even one word."),
});
const quotes = z.array(quote).max(4);
const scope = z.enum(["unclear", "educational_project", "supported_tasks", "independent_delivery", "area_tradeoffs", "direction_through_others"]);
const scopeLevels = { unclear: "unclear", educational_project: "junior", supported_tasks: "junior", independent_delivery: "mid", area_tradeoffs: "senior", direction_through_others: "lead" } as const;
const signal = z.object({ satisfied: z.boolean(), evidence: quotes });
const confidence = z.enum(["low", "medium", "high"]);
export const assessmentSchema = z.object({
  profile: z.object({ perceivedRole: z.string(), scope, confidence, evidence: quotes.describe("Quotes describing actual task/contribution/responsibility scope, not a goal, title or years alone.") }),
  evaluatedStage: z.enum(SENIORITIES),
  categories: z.array(z.object({ key: z.enum(RUBRIC_CATEGORY_KEYS), signals: z.array(signal).length(5) })).length(6),
  concerns: z.array(z.object({
    id: z.string().min(1), category: z.enum(RUBRIC_CATEGORY_KEYS), severity: z.enum(["minor", "important", "critical"]), confidence,
    kind: z.enum(["gap", "evidence"]),
    diagnosticKind: z.enum(["unattributed_contribution", "limited_contribution", "weak_exposure", "missing_verification", "limited_verification", "other"]),
    summary: z.string().min(1).describe("A specific diagnosis of document evidence, not a competence claim or an instruction."),
    evidence: quotes, verificationEvidence: quotes.describe("Quotes of actual checks of the same project, not functionality alone."),
  })).max(6),
});
type ModelAssessment = z.infer<typeof assessmentSchema>;
export type EvidenceAssessment = ModelAssessment & { profile: ModelAssessment["profile"] & { perceivedSeniority: "junior" | "mid" | "senior" | "lead" | "unclear" } };
export function usesEvidenceAssessment(_role: TargetRoleId, _seniority: Seniority, _context: CareerContext): boolean { return Boolean(_role && _seniority && _context); }

export function validateAssessment(raw: unknown, segments: Segment[], selected?: Seniority, context: CareerContext = "standard"): EvidenceAssessment {
  const parsed = assessmentSchema.parse(raw);
  const result: EvidenceAssessment = { ...parsed, profile: { ...parsed.profile, perceivedSeniority: scopeLevels[parsed.profile.scope] } };
  const sources = new Map(segments.map(segment => [segment.id, segment.text]));
  const verify = (items: z.infer<typeof quotes>) => {
    for (const item of items) if (!sources.get(item.ref)?.includes(item.quote)) throw new Error("ASSESSMENT_QUOTE_INVALID");
  };
  verify(result.profile.evidence);
  if (result.profile.perceivedSeniority !== "unclear" && !result.profile.evidence.length) throw new Error("ASSESSMENT_LEVEL_EVIDENCE_REQUIRED");
  if (new Set(result.categories.map(category => category.key)).size !== 6) throw new Error("ASSESSMENT_CATEGORIES_INVALID");
  for (const category of result.categories) for (const signal of category.signals) {
    verify(signal.evidence);
    if (signal.satisfied && !signal.evidence.length) throw new Error("ASSESSMENT_EVIDENCE_REQUIRED");
    if (!signal.satisfied) signal.evidence = [];
  }
  const scopeRefs = new Set(result.categories.filter(category => category.key !== "clarity").flatMap(category => category.signals.filter(signal => signal.satisfied).flatMap(signal => signal.evidence.map(item => item.ref))));
  if (result.profile.perceivedSeniority !== "unclear" && !result.profile.evidence.some(item => scopeRefs.has(item.ref))) throw new Error("ASSESSMENT_LEVEL_SCOPE_REQUIRED");
  const ids = new Set<string>();
  for (const concern of result.concerns) {
    if (ids.has(concern.id)) throw new Error("ASSESSMENT_CONCERN_IDS_INVALID");
    ids.add(concern.id); verify(concern.evidence); verify(concern.verificationEvidence);
    // A cited omission/context does not prove absence. Verify the quote, then
    // keep the public gap boundary empty, as in the report validator.
    if (concern.kind === "gap") concern.evidence = [];
    if (concern.kind === "evidence" && !concern.evidence.length) throw new Error("ASSESSMENT_CONCERN_EVIDENCE_REQUIRED");
    if (concern.severity === "critical" && concern.confidence === "low") throw new Error("ASSESSMENT_LOW_CONFIDENCE_CRITICAL");
  }
  if (selected) {
    const requested = resolveEvaluationStage(selected, context);
    const expected = requested === "auto" ? (result.profile.perceivedSeniority === "unclear" ? "auto" : result.profile.perceivedSeniority) : requested;
    if (result.evaluatedStage !== expected) throw new Error("ASSESSMENT_STAGE_MISMATCH");
  }
  return result;
}
export function scoreAssessment(assessment: EvidenceAssessment, role: TargetRoleId, _seniority: Seniority, locale: Locale, context: CareerContext) {
  const rubric = getRubric(assessment.evaluatedStage, role, locale, context);
  const categoryScores = rubric.map(category => {
    const finding = assessment.categories.find(item => item.key === category.key)!;
    const severity = assessment.concerns.filter(item => item.category === category.key).map(item => item.severity);
    // Material concerns lower the score; a high score never hides the concern.
    const cap = severity.includes("critical") ? SCORE_THRESHOLDS.criticalCap : severity.includes("important") ? SCORE_THRESHOLDS.importantCap : 100;
    return { ...category, score: Math.min(scoreEvidenceSignals(finding.signals.filter(signal => signal.satisfied).length), cap),
      evidenceStatus: (finding.signals.every(signal => !signal.satisfied) ? "none" : finding.signals.filter(signal => signal.satisfied).length <= 2 ? "indirect" : "concrete") as "none" | "indirect" | "concrete",
      evidenceRefs: [...new Set(finding.signals.flatMap(signal => signal.evidence.map(item => item.ref)))], rationale: "",
    };
  });
  const overallScore = calculateOverall(categoryScores);
  const ranks = { first_job: 0, junior: 0, mid: 1, senior: 2, lead: 3 } as const;
  const perceived = assessment.profile.perceivedSeniority;
  const supportsStage = perceived !== "unclear" && assessment.evaluatedStage !== "auto"
    && ranks[perceived] >= ranks[assessment.evaluatedStage];
  const simulatedDecision = overallScore >= STRONG_EVIDENCE_SCORE && supportsStage && !assessment.concerns.some(item => item.severity === "critical") ? "interview" as const : overallScore >= SCORE_THRESHOLDS.provisional ? "maybe" as const : "reject" as const;
  return { categoryScores, overallScore, perceivedSeniority: assessment.profile.perceivedSeniority,
    perceivedRole: assessment.profile.perceivedRole, perceivedSeniorityConfidence: assessment.profile.confidence,
    simulatedDecision, concerns: assessment.concerns,
  };
}
export type LockedAssessment = ReturnType<typeof scoreAssessment>;
export function lockAssessment(report: CVReport, locked: LockedAssessment): CVReport {
  const issues = report.issues.map(issue => {
    const concern = locked.concerns.find(item => item.id === issue.id);
    if (!concern) throw new Error("REPORT_UNASSESSED_ISSUE");
    return { ...issue, category: concern.category, severity: concern.severity, confidence: concern.confidence, diagnosticKind: concern.diagnosticKind,
      evidenceRefs: concern.kind === "gap" ? [] : [...new Set(concern.evidence.map(item => item.ref))],
      verificationEvidenceRefs: [...new Set(concern.verificationEvidence.map(item => item.ref))],
    };
  });
  if (issues.length !== locked.concerns.length || new Set(issues.map(issue => issue.id)).size !== issues.length) throw new Error("REPORT_MISSING_ASSESSED_ISSUE");
  return { ...report,
    document: { ...report.document, perceivedRole: report.document.perceivedRole, perceivedSeniority: locked.perceivedSeniority, perceivedSeniorityConfidence: locked.perceivedSeniorityConfidence },
    summary: { ...report.summary, overallScore: locked.overallScore,
      ...(locked.concerns.length === 0 ? { biggestRisk: report.locale === "pl" ? "Na podstawie widocznych dowodów nie wskazano istotnej luki w tej ocenie." : "No material evidence gap was identified from the visible CV evidence." } : {}),
    },
    recruiterSimulation: { ...report.recruiterSimulation, simulatedDecision: locked.simulatedDecision },
    issues,
    categoryScores: locked.categoryScores.map(category => ({ ...category, rationale: report.categoryScores.find(item => item.key === category.key)?.rationale || "" })),
  };
}
