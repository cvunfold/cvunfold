import type { CVReport } from "./schemas/report";
import { calculateOverall } from "./validate-report";
import { getRubric, RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { EN_PROMPT_VERSION } from "./prompts/archive/review-en-v1";
import { brand } from "@/lib/brand";

// Direct translation of the Polish sample: VertexPay is the current role,
// Railbird Mobility the previous one. Company names, the candidate name and
// the numbers are unchanged; only the sentences are translated.
const evidence = {
  seg_summary: "Senior Frontend Engineer with around eight years of experience in React and TypeScript, specialising in performance, accessibility and UI architecture.",
  seg_4: "Coordinated the frontend delivery of the customer onboarding redesign used by three product teams, working with product, design and backend.",
  seg_5: "Helped build a shared component library with 28 components, now used across several parts of the product.",
  seg_6: "Planned and delivered the migration of onboarding screens from legacy Redux patterns to hooks, React Query and a more modular frontend structure.",
  seg_7: "Improved Core Web Vitals and load performance across the onboarding and account-management flows.",
  seg_8: "Built customer-facing features, conducted code review and supported less experienced frontend developers with day-to-day technical questions.",
  seg_9: "Coordinated frontend implementation across several onboarding workstreams and took part in architecture discussions with backend engineers.",
  seg_patterns: "Established reusable patterns for forms, navigation, validation and feedback states, working with designers and engineers from other teams as adoption grew.",
  seg_rollout: "Set the rollout stages and release checks so the onboarding redesign shipped without disrupting active customer acquisition.",
  seg_a11y: "Introduced Playwright tests into the release process and improved keyboard navigation and form error handling after an accessibility review.",
  seg_b: "Reduced p75 LCP on the mobile booking flow from 4.4s to 2.5s and cut mobile booking abandonment by 10% through route-level code splitting, image optimisation and performance budgets in CI.",
  seg_c: "Authored an RFC for splitting the large frontend application into domain modules and led alignment with the backend and platform teams before rollout.",
} as const;

// Weighted to round to 79, not a rounder number — an important issue touches
// impact, ownership and clarity, so each stays within the rc4 calibration
// procedure's default cap of 79 for a category a material issue concerns.
const scores: Record<string, number> = {
  impact: 74,
  ownership: 76,
  credibility: 86,
  architecture: 82,
  collaboration: 82,
  clarity: 72,
};

const rationales: Record<string, string> = {
  impact: "The category has very strong evidence at Railbird Mobility: concrete LCP and abandonment results. At VertexPay, impact is stated but without a before/after comparison or an observable consequence, so the repeatability of evidence in the most recent role is limited.",
  ownership: "The CV shows planning a migration, authoring an RFC and leading it to agreement. In the most recent role, though, some bullets use the verbs “Coordinated” and “Helped”, which makes the boundaries of personal responsibility less clear.",
  credibility: "The document contains concrete frontend mechanisms and results: route-level code splitting, image optimisation, performance budgets, Playwright, an accessibility improvement and an architecture migration. This is evidence of practice, not just a technology list.",
  architecture: "The RFC on domain modules, the migration to a more modular structure and the shared component library show systems thinking. VertexPay, however, lacks detail on component boundaries, the library's API or the reasoning behind key trade-offs.",
  collaboration: "The CV shows collaboration with product, design, backend, QA and platform teams, plus work on a solution used by three product teams. Some bullets, however, do not specify what impact the applicant had on agreements and decisions.",
  clarity: "The CV has clear sections, chronology and distinct specialisations, but the best evidence — concrete performance results and the RFC — sits with the earlier role. The most recent role and its initiatives are more generic, so the signal hierarchy does not maximise how seniority is read.",
};

const categoryEvidenceRefs: Record<string, string[]> = {
  impact: ["seg_b", "seg_7"],
  ownership: ["seg_c", "seg_4", "seg_5"],
  credibility: ["seg_b", "seg_a11y", "seg_6"],
  architecture: ["seg_c", "seg_6", "seg_5"],
  collaboration: ["seg_4", "seg_9"],
  clarity: ["seg_b", "seg_c", "seg_8"],
};

const categoryScores = getRubric("senior", "frontend_developer", "en").map((category) => ({
  ...category,
  score: scores[category.key],
  rationale: rationales[category.key],
  evidenceRefs: categoryEvidenceRefs[category.key],
}));

export const sampleProfileEn = {
  name: "Julia Zawadzka",
  location: "Warsaw · hybrid",
  experience: "~8 years of experience",
  target: "Senior Frontend Engineer",
  note: `Julia Zawadzka, the companies and every business outcome are fictional. This sample demonstrates the format and level of detail of a ${brand.name} report.`,
  skills: ["React", "TypeScript", "React Query", "Web Performance", "Accessibility", "Playwright"],
  positions: [
    {
      company: "VertexPay",
      role: "Senior Frontend Engineer",
      period: "2023–present",
      bullets: [evidence.seg_4, evidence.seg_5, evidence.seg_6, evidence.seg_7, evidence.seg_8],
    },
    {
      company: "Railbird Mobility",
      role: "Senior Frontend Engineer",
      period: "2020–2023",
      bullets: [evidence.seg_b, evidence.seg_c, evidence.seg_a11y],
    },
  ],
  evidence,
} as const;

export const sampleReportEn: CVReport = {
  version: "2.1.0",
  rubricVersion: RUBRIC_VERSION,
  promptVersion: EN_PROMPT_VERSION,
  locale: "en",
  evidenceMap: evidence,
  document: {
    detectedLanguage: "en",
    parseQuality: "good",
    targetRole: "Frontend Developer",
    targetSeniority: "senior",
    perceivedRole: "Senior Frontend Engineer specialising in React, TypeScript, performance, accessibility and UI architecture",
    perceivedSeniority: "senior",
    perceivedSeniorityConfidence: "high",
  },
  summary: {
    overallScore: calculateOverall(categoryScores),
    oneSentenceVerdict: "The CV credibly communicates Senior Frontend level, mainly through strong performance, architecture and quality evidence from the earlier role, but the most recent experience is described more generically and shows result and individual-ownership boundaries less clearly.",
    strongestSignal: "Measurable performance impact combined with an architectural decision in the Senior Frontend Engineer role at Railbird Mobility.",
    biggestRisk: "The most recent role describes a wide range of initiatives but without results or clear ownership boundaries, making its contribution to seniority harder to confirm.",
  },
  recruiterPerspective: {
    profileSummary: "The document shows an experienced frontend profile with around eight years in React and TypeScript. The strongest evidence concerns performance, modular architecture, end-to-end testing and accessibility. The most recent role suggests a broader scope of responsibility, but its description is less concrete than the Railbird Mobility role.",
    seniorityAlignment: "aligned",
    seniorityAlignmentExplanation: "The Senior target is supported by concrete technical decisions, results, usage scale, cross-team work and delivery-process impact. The reading of seniority rests mainly on Railbird Mobility, while VertexPay strengthens the picture of scope but documents impact and individual contribution less clearly.",
    positiveSignals: [
      {
        title: "Measurable impact on performance and the product",
        explanation: "The CV shows both the technical mechanism and the business/user outcome: the optimisations reduced p75 LCP from 4.4s to 2.5s and cut mobile booking abandonment by 10%.",
        evidenceRefs: ["seg_b"],
      },
      {
        title: "Credible architectural thinking",
        explanation: "The RFC on splitting the application into domain modules, and leading it to agreement with the backend and platform teams, is concrete evidence of a systems-level decision beyond a single feature.",
        evidenceRefs: ["seg_c"],
      },
      {
        title: "A practical approach to quality and accessibility",
        explanation: "Introducing Playwright tests into the release process, and improving keyboard navigation and form error handling after an accessibility review, show quality practices applied in the product.",
        evidenceRefs: ["seg_a11y"],
      },
      {
        title: "Breadth of frontend collaboration and impact",
        explanation: "The VertexPay description points to work on a process used by three product teams, a shared library of 28 components, and collaboration with product, design and backend.",
        evidenceRefs: ["seg_4", "seg_5"],
      },
    ],
    reservations: [
      {
        kind: "evidence",
        title: "The most recent role shows results less clearly",
        explanation: "VertexPay contains important initiatives, but the bullets on Core Web Vitals, the migration and the component library state no observable result or improvement mechanism.",
        evidenceRefs: ["seg_6", "seg_7"],
      },
      {
        kind: "evidence",
        title: "Individual ownership boundaries need clarification",
        explanation: "The phrases “Helped build”, “Coordinated” and “took part in discussions” show involvement in important initiatives, but do not clearly separate personal decisions from the team's work.",
        evidenceRefs: ["seg_4", "seg_5", "seg_9"],
      },
      {
        kind: "evidence",
        title: "The strongest evidence of seniority sits in the earlier role",
        explanation: "The most convincing numbers and architectural decisions are described at Railbird Mobility, while the most recent role occupies the more prominent position but has more generic bullets.",
        evidenceRefs: ["seg_b", "seg_c"],
      },
    ],
    likelyInterviewQuestions: [
      {
        question: "Which technical decisions during the migration from Redux to hooks and React Query belonged directly to you, and which were agreed as a team?",
        whyThisQuestion: "The CV describes planning and delivering the migration, but does not show its scope, constraints or specific trade-offs.",
        evidenceRefs: ["seg_6"],
      },
      {
        question: "What concrete result did the 28-component library deliver, and what was the scope of your personal contribution to building it?",
        whyThisQuestion: "The document states the component count and adoption, but does not describe the effect on consistency, delivery speed, quality or ownership of standards.",
        evidenceRefs: ["seg_5"],
      },
      {
        question: "How was the Core Web Vitals and performance improvement at VertexPay measured, and which technical work had the biggest effect?",
        whyThisQuestion: "The most recent role states a performance improvement but gives no before/after values or improvement mechanism.",
        evidenceRefs: ["seg_7"],
      },
      {
        question: "What were the constraints and criteria for the staged rollout of the onboarding modernisation?",
        whyThisQuestion: "The CV points to pre-release checks and a rollout that did not disrupt onboarding, but does not explain the decisions, risks or coordination involved.",
        evidenceRefs: ["seg_rollout"],
      },
    ],
  },
  categoryScores,
  recruiterSimulation: {
    after5Seconds: "A Senior Frontend Engineer with around eight years of experience, focused on React, TypeScript, performance, accessibility and UI architecture.",
    after10Seconds: "A concrete performance result stands out — p75 LCP down from 4.4s to 2.5s — along with experience authoring an RFC and splitting a large application into domain modules.",
    after20Seconds: "The profile gives good reason for a Senior Frontend conversation, but raises the question of whether the most recent role had comparable impact and ownership scope, since its results are described less concretely.",
    simulatedDecision: "interview",
    confidence: "high",
    reasons: [
      "The performance result is measurable and tied to a concrete technical mechanism.",
      "The RFC and the alignment with backend and platform teams show architectural impact.",
      "The most recent role shows a wide collaboration scope, even though its results are described less concretely.",
    ],
    whatCouldImproveDecision: [
      "Clarifying results and personal decisions in the most recent VertexPay role.",
      "Better surfacing the strongest evidence without implying that Railbird Mobility's results belong to VertexPay.",
    ],
  },
  strengths: [
    {
      id: "s1",
      title: "A performance result tied to its mechanism",
      explanation: "The document does not stop at a performance-improvement claim: it states the p75 LCP change, the effect on booking abandonment, and the technical work behind it.",
      evidenceRefs: ["seg_b"],
    },
    {
      id: "s2",
      title: "Evidence of an architectural decision",
      explanation: "Authoring the RFC on domain modules and leading it to agreement with other teams show work on the structure of a larger frontend application.",
      evidenceRefs: ["seg_c"],
    },
    {
      id: "s3",
      title: "Frontend quality spanning testing and accessibility",
      explanation: "Introducing Playwright into the release process, plus concrete keyboard-navigation and form-error-handling improvements, strengthen the profile's credibility.",
      evidenceRefs: ["seg_a11y"],
    },
    {
      id: "s4",
      title: "Experience with shared solutions",
      explanation: "The 28-component library and the reusable patterns for forms, navigation, validation and feedback states show impact broader than a single feature.",
      evidenceRefs: ["seg_5", "seg_patterns"],
    },
  ],
  issues: [
    {
      id: "i1",
      severity: "important",
      category: "impact",
      title: "The most recent role states an improvement but not its consequence",
      explanation: "VertexPay bullets mention improving Core Web Vitals, the component library and the migration, but show no before/after values, regression reduction, faster delivery or other observable outcome. The earlier role contains a markedly stronger impact signal.",
      whyItMatters: "For a Senior target, the reader needs to see that impact and results are current, not only tied to earlier experience.",
      evidenceRefs: ["seg_5", "seg_6", "seg_7", "seg_b"],
      confidence: "high",
      action: "For each key VertexPay initiative, establish a concrete observable consequence, then add it to the relevant bullet only when it follows from actual data or a confirmable effect.",
      suggestion: {
        type: "question",
        original: evidence.seg_7,
        proposed: null,
        factualityNote: "The CV does not contain enough to safely write a stronger version without adding an unknown fact. What was the Core Web Vitals value before and after the VertexPay change?",
      },
    },
    {
      id: "i2",
      severity: "important",
      category: "ownership",
      title: "Individual ownership boundaries are unclear in the most important initiatives",
      explanation: "VertexPay uses the phrases “Coordinated”, “Helped build” and “took part in architecture discussions”. These show involvement in important work, but do not explain which decisions, implementation elements and agreements belonged directly to the applicant.",
      whyItMatters: "An unclear split of responsibility can weaken the Senior-level reading, even when the initiative itself has the right scope.",
      evidenceRefs: ["seg_4", "seg_5", "seg_9", "seg_patterns"],
      confidence: "high",
      action: "Clarify the personal decisions, implementation scope and responsibility for agreements in the onboarding redesign and the component library before strengthening the verbs describing your contribution.",
      suggestion: {
        type: "question",
        original: evidence.seg_5,
        proposed: null,
        factualityNote: "Do not replace “Helped build” with a stronger verb without confirming the real ownership scope. Which component-library decisions were directly yours?",
      },
    },
    {
      id: "i3",
      severity: "important",
      category: "clarity",
      title: "The strongest evidence is less exposed than the most recent role",
      explanation: "The most concrete achievements — the LCP result, the effect on booking abandonment and the architectural RFC — sit with Railbird Mobility. VertexPay, the first and most prominent role, is dominated by descriptions of coordination, feature-building and support.",
      whyItMatters: "A first read of the CV may suggest less current impact than the document as a whole actually shows.",
      evidenceRefs: ["seg_4", "seg_5", "seg_6", "seg_8", "seg_b", "seg_c"],
      confidence: "high",
      action: "Move the LCP result and the RFC closer to the summary, keeping their attribution to the Senior Frontend Engineer role at Railbird Mobility.",
      suggestion: {
        type: "expose",
        original: evidence.seg_b,
        proposed: "Reducing p75 LCP on the booking flow from 4.4s to 2.5s and cutting mobile booking abandonment by 10%, together with the RFC splitting the application into domain modules agreed with the backend and platform teams — the strongest evidence of seniority in this document — is worth surfacing closer to the summary, while keeping its attribution to the Senior Frontend Engineer role at Railbird Mobility.",
        factualityNote: "This change uses only existing facts; only their exposure changes, and the attribution to Railbird Mobility is preserved so the result does not look like a VertexPay achievement.",
      },
    },
  ],
  ats: {
    score: 100,
    checks: [
      { id: "text_layer", status: "pass" }, { id: "reading_order", status: "pass" }, { id: "sections", status: "pass" },
      { id: "dates_titles", status: "pass" }, { id: "contact_info", status: "pass" }, { id: "layout_columns", status: "pass" },
      { id: "glyph_artifacts", status: "pass" }, { id: "date_format", status: "pass" },
    ],
  },
  jobMatch: null,
  nextSteps: [
    { priority: 1, title: "Clarify the impact of the most recent role", action: "Establish and add to the VertexPay bullets verifiable results for the performance improvement, the migration and the component library, without inventing new or unconfirmed metrics.", expectedImpact: "high" },
    { priority: 2, title: "Clarify your personal scope of responsibility", action: "In the VertexPay descriptions, separate your own decisions and actions from the team's work, particularly for onboarding, the component library and the migration rollout.", expectedImpact: "high" },
    { priority: 3, title: "Strengthen the hierarchy of existing evidence", action: "Move or highlight the LCP result and the RFC in the achievements summary, while keeping their attribution to Railbird Mobility unambiguous.", expectedImpact: "medium" },
  ],
  limitations: [
    "The review covers only information visible in the sample document.",
    "The first-impression simulation does not predict the outcome of a specific hiring process.",
    "Every person, company and outcome in this sample is fictional.",
  ],
};
