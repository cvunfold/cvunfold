import { z } from "zod";

const evidenceRef = z.string().regex(/^seg_[a-z0-9_]+$/);
const confidence = z.enum(["low", "medium", "high"]);
// Must stay in sync with the rubric keys in @/lib/rubrics/technical-v1. A free
// string here let models answer with invented labels ("Design systemy i wpływ na
// produkt"), which silently broke every rule that ties an issue to its category.
export const RUBRIC_CATEGORY_KEYS = ["impact", "ownership", "credibility", "architecture", "collaboration", "clarity", "ats"] as const;
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
    targetSeniority: z.enum(["junior", "mid", "senior", "lead", "auto"]),
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
    positiveSignals: z.array(perspectiveSignal).min(2).max(4),
    reservations: z.array(perspectiveSignal.extend({ kind: z.enum(["evidence", "gap"]) })).min(1).max(4),
    likelyInterviewQuestions: z.array(z.object({
      question: z.string(),
      whyThisQuestion: z.string(),
      evidenceRefs: z.array(evidenceRef),
    })).min(2).max(5),
  }),
  categoryScores: z.array(z.object({
    key: z.string(), label: z.string(), score: z.number().min(0).max(100),
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
    explanation: z.string(), whyItMatters: z.string(), evidenceRefs: z.array(evidenceRef), confidence,
    action: z.string().describe("A complete, document-specific instruction. Never a suggestion type label such as Rewrite, Expose, Gap or Question."),
    suggestion: z.object({
      type: z.enum(["rewrite", "expose", "gap", "question"]), original: z.string().nullable(),
      proposed: z.string().nullable(), factualityNote: z.string(),
    }).nullable(),
  })),
  ats: z.object({ score: z.number().min(0).max(100), findings: z.array(z.object({
    type: z.enum(["positive", "warning", "error"]), title: z.string(), explanation: z.string(),
  })) }),
  jobMatch: z.object({ score: z.number().min(0).max(100), strongestMatches: z.array(z.string()),
    missingEvidence: z.array(z.string()), misplacedEvidence: z.array(z.string()), recommendations: z.array(z.string()) }).nullable(),
  nextSteps: z.array(z.object({ priority: z.number().int().positive(), title: z.string(), action: z.string().describe("A concrete next step written as a complete instruction, not a category label."), expectedImpact: z.enum(["low", "medium", "high"]) })),
  limitations: z.array(z.string()),
});

export type ModelReport = z.infer<typeof reportSchema>;
export type EvidenceMap = Record<string, string>;
// evidenceMap is server-enriched. It is optional only for reports created before
// the launch migration; every new report receives a map built from parsed CV segments.
export type CVReport = ModelReport & { evidenceMap?: EvidenceMap };

export type TeaserSeverityCounts = { critical: number; important: number; minor: number };

// This is the complete unpaid boundary. Keep it intentionally small: it must be
// safe to serialize to an unpaid browser session without exposing the report's
// other issues, recommendations, evidence references, or recruiter rationale.
export type TeaserReport = Pick<CVReport, "version" | "locale"> & {
  profileSummary: string;
  firstImpression: string;
  issueCount: number;
  severityCounts: TeaserSeverityCounts;
  featuredIssue: {
    title: string;
    evidence: string;
    interpretation: string;
    actionDirection: string;
  } | null;
};
