import type { EvidenceAssessment } from "../evidence-assessment";
import type { CareerContext } from "../career-context";
import { z } from "zod";
import type { AtsCheckResult } from "@/lib/ats-checker/types";

export const REPORT_SCHEMA_VERSION = "2.1.0";

const evidenceRef = z.string().regex(/^seg_[a-z0-9_]+$/);
const confidence = z.enum(["low", "medium", "high"]);
// Must stay in sync with the rubric keys in @/lib/rubrics/technical-v1. A free
// string here let models answer with invented labels ("Design systemy i wpływ na
// produkt"), which silently broke every rule that ties an issue to its category.
// "ats" is deliberately absent: document hygiene is now a deterministic check
// (@/lib/ats-checker), not a model-scored rubric category.
export const RUBRIC_CATEGORY_KEYS = ["impact", "ownership", "credibility", "architecture", "collaboration", "clarity"] as const;
export type RubricCategoryKey = (typeof RUBRIC_CATEGORY_KEYS)[number];
const rubricCategoryKey = z.enum(RUBRIC_CATEGORY_KEYS);
const perspectiveSignal = z.object({
  title: z.string(),
  explanation: z.string(),
  evidenceRefs: z.array(evidenceRef),
});

export const reportSchema = z.object({
  version: z.string(),
  rubricVersion: z.string(),
  promptVersion: z.string(),
  locale: z.enum(["pl", "en"]),
  document: z.object({
    detectedLanguage: z.enum(["pl", "en", "mixed"]),
    parseQuality: z.enum(["good", "degraded"]),
    targetRole: z.string(),
    targetSeniority: z.enum(["first_job", "junior", "mid", "senior", "lead", "auto"]),
    perceivedRole: z.string(),
    perceivedSeniority: z.enum(["junior", "mid", "senior", "lead", "unclear"]),
    perceivedSeniorityConfidence: confidence,
  }),
  summary: z.object({
    overallScore: z.number().int().min(0).max(100),
    oneSentenceVerdict: z.string(),
    strongestSignal: z.string(),
    biggestRisk: z.string(),
  }),
  recruiterPerspective: z.object({
    profileSummary: z.string(),
    seniorityAlignment: z.enum(["aligned", "undersold", "unsupported", "unclear"]),
    seniorityAlignmentExplanation: z.string(),
    positiveSignals: z.array(perspectiveSignal).max(4),
    reservations: z.array(perspectiveSignal.extend({ kind: z.enum(["evidence", "gap"]), issueId: z.string().optional() })).max(4),
    likelyInterviewQuestions: z.array(z.object({
      question: z.string(),
      whyThisQuestion: z.string(),
      evidenceRefs: z.array(evidenceRef),
    })).max(5),
  }),
  categoryScores: z.array(z.object({
    key: z.string(), label: z.string(), score: z.number().min(0).max(100),
    evidenceStatus: z.enum(["none", "indirect", "concrete"]).optional(),
    weight: z.number().min(0).max(1), rationale: z.string(), evidenceRefs: z.array(evidenceRef),
  })).min(1),
  recruiterSimulation: z.object({
    after5Seconds: z.string(), after10Seconds: z.string(), after20Seconds: z.string(),
    simulatedDecision: z.enum(["interview", "maybe", "reject"]),
    confidence,
    reasons: z.array(z.string()), whatCouldImproveDecision: z.array(z.string()),
  }),
  strengths: z.array(z.object({ id: z.string(), title: z.string(), explanation: z.string(), evidenceRefs: z.array(evidenceRef) })),
  issues: z.array(z.object({
    id: z.string(), severity: z.enum(["minor", "important", "critical"]), category: rubricCategoryKey, title: z.string(),
    verificationEvidenceRefs: z.array(evidenceRef).optional(),
    diagnosticKind: z.enum(["unattributed_contribution", "limited_contribution", "weak_exposure", "missing_verification", "limited_verification", "other"]).optional(),
    explanation: z.string(), whyItMatters: z.string(), evidenceRefs: z.array(evidenceRef), confidence,
    action: z.string().describe("A complete, document-specific instruction. Never a suggestion type label such as Rewrite, Expose, Gap or Question."),
    suggestion: z.object({
      type: z.enum(["rewrite", "expose", "gap", "question"]), original: z.string().nullable(),
      proposed: z.string().nullable(), factualityNote: z.string(),
    }).nullable(),
  })),
  jobMatch: z.object({ score: z.number().min(0).max(100), strongestMatches: z.array(z.string()),
    missingEvidence: z.array(z.string()), misplacedEvidence: z.array(z.string()), recommendations: z.array(z.string()) }).nullable(),
  nextSteps: z.array(z.object({ issueId: z.string().optional(), priority: z.number().int().positive(), title: z.string(), action: z.string().describe("A concrete next step written as a complete instruction, not a category label."), expectedImpact: z.enum(["low", "medium", "high"]) })),
  limitations: z.array(z.string()),
});

// New provider output is strict; persisted reports keep the optional fields
// above so existing private reports remain readable without being re-scored.
export const modelResponseSchema = reportSchema.extend({
  recruiterPerspective: reportSchema.shape.recruiterPerspective.extend({
    reservations: z.array(reportSchema.shape.recruiterPerspective.shape.reservations.element.extend({ issueId: z.string() })).max(4),
  }),
  categoryScores: z.array(reportSchema.shape.categoryScores.element.extend({
    key: rubricCategoryKey,
    evidenceStatus: z.enum(["none", "indirect", "concrete"]),
  })).length(RUBRIC_CATEGORY_KEYS.length),
  issues: z.array(reportSchema.shape.issues.element.extend({
    verificationEvidenceRefs: z.array(evidenceRef).describe("Existing CV statements about checking/testing the same project discussed by this issue. Do not cite functionality alone. Use [] when no relevant checks are described or this issue is unrelated to verification."),
    diagnosticKind: z.enum(["unattributed_contribution", "limited_contribution", "weak_exposure", "missing_verification", "limited_verification", "other"]),
  })),
  nextSteps: z.array(reportSchema.shape.nextSteps.element.extend({ issueId: z.string() })),
});

export type ModelReport = z.infer<typeof reportSchema>;
export type EvidenceMap = Record<string, string>;
// evidenceMap is server-enriched. It is optional only for reports created before
// the launch migration; every new report receives a map built from parsed CV segments.
// ats is server-computed by the deterministic checker (@/lib/ats-checker), not
// part of the model's own Zod-validated output, and rides along in the same
// stored JSON blob. Optional only for reports created before this field existed.
export type CVReport = ModelReport & { document: ModelReport["document"] & { careerContext?: CareerContext }; evidenceMap?: EvidenceMap; evidenceAssessment?: { version: string; checks: EvidenceAssessment }; ats?: AtsCheckResult };

export type TeaserSeverityCounts = { critical: number; important: number; minor: number };

// This is the complete unpaid boundary. Keep it intentionally small: it must be
// safe to serialize to an unpaid browser session without exposing the report's
// other issues, recommendations, evidence references, or recruiter rationale.
// ats is the one exception — deterministic document hygiene, not a subjective
// content judgement, so it is safe (and the point) to show in full for free.
export type TeaserReport = Pick<CVReport, "version" | "locale"> & {
  profileSummary: string;
  firstImpression: string;
  issueCount: number;
  severityCounts: TeaserSeverityCounts;
  featuredIssue: {
    title: string;
    evidence: string;
    evidenceKind?: "quote" | "gap";
    interpretation: string;
    actionDirection: string;
  } | null;
  ats?: AtsCheckResult;
};
