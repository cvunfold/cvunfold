import { z } from "zod";

const evidenceRef = z.string().regex(/^seg_[a-z0-9_]+$/);
const confidence = z.enum(["low", "medium", "high"]);

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
    id: z.string(), severity: z.enum(["minor", "important", "critical"]), category: z.string(), title: z.string(),
    explanation: z.string(), whyItMatters: z.string(), evidenceRefs: z.array(evidenceRef), confidence,
    action: z.string(),
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
  nextSteps: z.array(z.object({ priority: z.number().int().positive(), title: z.string(), action: z.string(), expectedImpact: z.enum(["low", "medium", "high"]) })),
  limitations: z.array(z.string()),
});

export type CVReport = z.infer<typeof reportSchema>;

export type TeaserReport = Pick<CVReport, "version" | "locale" | "document" | "summary" | "recruiterSimulation"> & {
  categoryScores: CVReport["categoryScores"];
  counts: { strengths: number; issues: number; nextSteps: number };
  ats: { score: number; findingCount: number };
};
