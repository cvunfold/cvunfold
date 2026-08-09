import type { CVReport } from "./schemas/report";
import { calculateOverall } from "./validate-report";
import { getRubric, RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { EN_PROMPT_VERSION } from "./prompts/review-en-v1";

const evidence = {
  seg_summary: "Senior Frontend Developer with 7 years of experience in React, TypeScript and Next.js. I specialise in application performance and design systems.",
  seg_exp_1: "Led the migration of three critical checkout journeys to Next.js. After release, p75 LCP fell from 3.1s to 2.2s and mobile abandonment decreased by 8%.",
  seg_exp_2: "Designed and implemented a design system with 32 components used by four product teams.",
  seg_exp_3: "Developed new features in React and TypeScript. Code review. Collaboration with UX and backend.",
  seg_exp_4: "Authored the RFC for splitting the frontend monolith into domain modules and led alignment with the Checkout, Account and Platform teams.",
  seg_project_1: "Created CI performance budgets and a Web Vitals dashboard that detects regressions before production release.",
} as const;

const scores: Record<string, number> = { impact: 82, ownership: 72, credibility: 90, architecture: 80, collaboration: 84, clarity: 74, ats: 86 };
const rationales: Record<string, string> = {
  impact: "The CV contains measurable performance and conversion outcomes, but not for every important project.",
  ownership: "The migration and RFC show initiative; some bullets still fail to separate the candidate's contribution from the team's work.",
  credibility: "Technologies appear in concrete contexts: migration, Web Vitals measurement, CI and a design system.",
  architecture: "The document shows decisions about modularisation and standards shared by several teams.",
  collaboration: "Product, UX and backend collaboration is visible, as is cross-team decision facilitation.",
  clarity: "The strongest evidence is specific, but it is mixed with generic responsibility bullets.",
  ats: "Standard headings, a clear chronology and contextual keywords support parsing.",
};
const categoryScores = getRubric("senior", "frontend_developer", "en").map((category) => ({ ...category, score: scores[category.key], rationale: rationales[category.key], evidenceRefs: category.key === "ats" ? ["seg_summary"] : ["seg_exp_1", "seg_exp_4"] }));

export const sampleProfileEn = {
  name: "Marta Nowak",
  note: "Marta Nowak, the companies and every business outcome are fictional. This sample demonstrates the report format and level of detail.",
  evidence,
} as const;

export const sampleReportEn: CVReport = {
  version: "2.0.0", rubricVersion: RUBRIC_VERSION, promptVersion: EN_PROMPT_VERSION, locale: "en", evidenceMap: evidence,
  document: { detectedLanguage: "en", parseQuality: "good", targetRole: "Frontend Developer", targetSeniority: "senior", perceivedRole: "Frontend Developer", perceivedSeniority: "senior", perceivedSeniorityConfidence: "high" },
  summary: {
    overallScore: calculateOverall(categoryScores),
    oneSentenceVerdict: "The document credibly communicates Senior level, but loses some force because the candidate's individual contribution is unclear.",
    strongestSignal: "Measurable checkout performance impact combined with architectural initiative.",
    biggestRisk: "The strongest evidence sits next to generic responsibilities, so ownership is not always unambiguous.",
  },
  recruiterPerspective: {
    profileSummary: "Senior Frontend Developer with a strong web-performance specialisation and visible architectural and cross-team impact.",
    seniorityAlignment: "aligned",
    seniorityAlignmentExplanation: "The document communicates Senior level through measurable outcomes, initiative and work beyond the candidate's own backlog. The main uncertainty is her exact decision scope in the design system.",
    positiveSignals: [
      { title: "Impact connected to a product outcome", explanation: "The LCP improvement is linked to lower mobile checkout abandonment, making the product relevance visible.", evidenceRefs: ["seg_exp_1"] },
      { title: "Architectural initiative", explanation: "Authoring an RFC and leading alignment with three teams suggests autonomy and influence over direction.", evidenceRefs: ["seg_exp_4"] },
      { title: "A specialisation backed by practice", explanation: "CI performance budgets and a Web Vitals dashboard make the performance profile credible and distinctive.", evidenceRefs: ["seg_project_1"] },
    ],
    reservations: [
      { kind: "evidence", title: "Unclear design-system ownership", explanation: "‘Designed and implemented’ does not show which decisions belonged to the candidate and which to the four adopting teams.", evidenceRefs: ["seg_exp_2"] },
      { kind: "evidence", title: "Strong evidence is mixed with duties", explanation: "The generic feature-development, review and collaboration bullet weakens the precise picture created by the other achievements.", evidenceRefs: ["seg_exp_3"] },
    ],
    likelyInterviewQuestions: [
      { question: "Which design-system decisions did you own directly?", whyThisQuestion: "The interviewer will want to separate individual ownership from work shared by several teams.", evidenceRefs: ["seg_exp_2"] },
      { question: "What trade-off shaped the split into domain modules?", whyThisQuestion: "The RFC is a strong seniority signal, but the CV does not show alternatives or decision criteria.", evidenceRefs: ["seg_exp_4"] },
      { question: "What changed after design-system adoption beyond the component count?", whyThisQuestion: "Scale is visible, but the organisational or product outcome is not.", evidenceRefs: ["seg_exp_2"] },
    ],
  },
  categoryScores,
  recruiterSimulation: {
    after5Seconds: "An experienced Frontend Developer with a current stack and a clear progression.",
    after10Seconds: "Specific outcomes stand out: improved LCP, lower abandonment and a design system used by four teams.",
    after20Seconds: "The profile meets Senior expectations; the interview still needs to establish individual contribution to team initiatives.",
    simulatedDecision: "interview", confidence: "high",
    reasons: ["Outcomes are measurable and placed in product context.", "The CV shows initiated change, not just delivered tasks.", "Technologies are supported by concrete applications."],
    whatCouldImproveDecision: ["Clarify personal responsibility for the design system.", "Replace the generic feature-development bullet with one decision or outcome."],
  },
  strengths: [
    { id: "s1", title: "Outcomes connected to product value", explanation: "The LCP improvement is not isolated; it is connected to lower mobile checkout abandonment.", evidenceRefs: ["seg_exp_1"] },
    { id: "s2", title: "Visible architectural initiative", explanation: "Authoring the RFC and leading alignment signal influence beyond the candidate's own backlog.", evidenceRefs: ["seg_exp_4"] },
    { id: "s3", title: "Technical credibility", explanation: "Web Vitals, performance budgets and CI form a specific and coherent performance specialisation.", evidenceRefs: ["seg_project_1"] },
    { id: "s4", title: "Cross-team impact", explanation: "A design system used by four teams shows organisational scale.", evidenceRefs: ["seg_exp_2"] },
  ],
  issues: [
    { id: "i1", severity: "critical", category: "ownership", title: "‘Designed and implemented’ hides the actual decision scope", explanation: "The design system sounds substantial, but the bullet does not separate the candidate's decisions, implementation work and the contribution of other teams.", whyItMatters: "For a Senior role, the reader needs to understand decision scope: API standards, governance, adoption, migration or component implementation.", evidenceRefs: ["seg_exp_2"], confidence: "high", action: "Add the verified responsibility scope and how adoption across four teams was achieved.", suggestion: { type: "question", original: evidence.seg_exp_2, proposed: null, factualityNote: "Which design-system decisions did you own directly, and how did adoption work across the four teams?" } },
    { id: "i2", severity: "important", category: "clarity", title: "A generic bullet weakens an otherwise strong section", explanation: "After two concrete achievements, a list of standard responsibilities adds no new information.", whyItMatters: "The reader may interpret the section as shared team duties instead of noticing individual impact.", evidenceRefs: ["seg_exp_3"], confidence: "high", action: "Remove the bullet or replace it with one specific feature, decision or problem solved with UX and backend.", suggestion: { type: "rewrite", original: evidence.seg_exp_3, proposed: "Developed features in React and TypeScript, conducted code review and collaborated with UX and backend.", factualityNote: "This only organises facts already present; replacing it with a concrete example would be stronger." } },
    { id: "i3", severity: "important", category: "impact", title: "The design system has no stated outcome", explanation: "The number of components and teams shows scale, but not what changed after adoption.", whyItMatters: "Solution scale is not the same as impact. The effect may have been faster delivery, fewer regressions or consistency — the document does not establish which.", evidenceRefs: ["seg_exp_2"], confidence: "medium", action: "Add only a verified adoption outcome, or explicitly leave the bullet without a number.", suggestion: { type: "gap", original: null, proposed: null, factualityNote: "Do not add percentages or time savings without data. Check pull requests, release notes or adoption metrics." } },
    { id: "i4", severity: "minor", category: "clarity", title: "The performance specialisation appears too late", explanation: "Performance budgets and automatic regression detection are strong differentiators, but only appear in an earlier role.", whyItMatters: "This evidence supports the current specialisation and should be visible in the summary or most recent experience.", evidenceRefs: ["seg_project_1"], confidence: "high", action: "Add a short reference to performance governance in the summary without duplicating the full bullet.", suggestion: { type: "expose", original: null, proposed: null, factualityNote: "This exposure change uses only information already present in the CV." } },
  ],
  ats: { score: 86, findings: [
    { type: "positive", title: "Standard structure", explanation: "Section names, job titles and dates are easy for a parser to identify." },
    { type: "positive", title: "Keywords have context", explanation: "React, Next.js, CI and Web Vitals appear next to concrete work." },
    { type: "warning", title: "Some stack duplication", explanation: "The skills list repeats technology already visible in experience and could be shorter." },
  ] },
  jobMatch: null,
  nextSteps: [
    { priority: 1, title: "Clarify design-system ownership", action: "Name your decisions, collaboration and responsibility for adoption.", expectedImpact: "high" },
    { priority: 2, title: "Remove the generic duty bullet", action: "Replace it with one specific product problem and your contribution.", expectedImpact: "high" },
    { priority: 3, title: "Add a design-system outcome", action: "Check available evidence and state the effect without estimating unknown numbers.", expectedImpact: "medium" },
    { priority: 4, title: "Expose the specialisation", action: "Move the performance-governance signal into the profile summary.", expectedImpact: "medium" },
  ],
  limitations: ["The review covers only information visible in the sample document.", "The first-impression simulation does not predict a specific hiring process.", "Every person, company and outcome in this sample is fictional."],
};
