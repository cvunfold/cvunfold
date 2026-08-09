import type { CVReport, TeaserReport } from "./schemas/report";
import { reportSchema } from "./schemas/report";
import type { RubricCategory } from "@/lib/rubrics/technical-v1";

export function calculateOverall(categories: CVReport["categoryScores"]): number {
  const weight = categories.reduce((sum, category) => sum + category.weight, 0);
  if (Math.abs(weight - 1) > 0.001) throw new Error("INVALID_RUBRIC_WEIGHTS");
  return Math.round(categories.reduce((sum, category) => sum + category.score * category.weight, 0));
}

export function applyServerRubric(report: CVReport, rubric: RubricCategory[]): CVReport {
  const modelCategories = new Map(report.categoryScores.map((category) => [category.key, category]));
  const categoryScores = rubric.map((category) => {
    const modelCategory = modelCategories.get(category.key);
    if (!modelCategory) return {
      ...category,
      score: 0,
      rationale: "Model nie zwrócił oceny tej kategorii.",
      evidenceRefs: [],
    };
    return {
      ...modelCategory,
      key: category.key,
      label: category.label,
      weight: category.weight,
    };
  });
  return { ...report, categoryScores };
}

export function validateEvidence(report: CVReport, validRefs: Set<string>): CVReport {
  const parsed = reportSchema.parse(report);
  const keep = (refs: string[]) => refs.filter((ref) => validRefs.has(ref));
  const categoryScores = parsed.categoryScores.map((category) => ({ ...category, evidenceRefs: keep(category.evidenceRefs) }));
  const strengths = parsed.strengths.filter((item) => keep(item.evidenceRefs).length > 0).map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  const issues = parsed.issues.filter((item) => item.suggestion?.type === "gap" || item.suggestion?.type === "question" || keep(item.evidenceRefs).length > 0)
    .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  const recruiterPerspective = {
    ...parsed.recruiterPerspective,
    positiveSignals: parsed.recruiterPerspective.positiveSignals
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }))
      .filter((item) => item.evidenceRefs.length > 0),
    reservations: parsed.recruiterPerspective.reservations
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }))
      .filter((item) => item.kind === "gap" || item.evidenceRefs.length > 0),
    likelyInterviewQuestions: parsed.recruiterPerspective.likelyInterviewQuestions
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) })),
  };
  return { ...parsed, recruiterPerspective, categoryScores, strengths, issues, summary: { ...parsed.summary, overallScore: calculateOverall(categoryScores) } };
}

export function withRecruiterPerspective(report: CVReport): CVReport {
  if (report.recruiterPerspective) return report;
  const ranks = { junior: 0, mid: 1, senior: 2, lead: 3 } as const;
  const target = report.document.targetSeniority;
  const perceived = report.document.perceivedSeniority;
  const seniorityAlignment = target === "auto" || perceived === "unclear"
    ? "unclear"
    : target === perceived
      ? "aligned"
      : ranks[perceived] < ranks[target]
        ? "undersold"
        : "unsupported";
  const alignmentCopy = {
    aligned: "Odczytany poziom jest zgodny z poziomem wskazanym w analizie.",
    undersold: "Dokument komunikuje niższy poziom niż wskazany cel, mimo że może nie pokazywać całego doświadczenia.",
    unsupported: "Deklarowany poziom nie ma jeszcze wystarczająco widocznego uzasadnienia w dokumencie.",
    unclear: "Na podstawie samego dokumentu poziom pozostaje niejednoznaczny.",
  } as const;
  return {
    ...report,
    recruiterPerspective: {
      profileSummary: report.summary.oneSentenceVerdict,
      seniorityAlignment,
      seniorityAlignmentExplanation: alignmentCopy[seniorityAlignment],
      positiveSignals: report.strengths.slice(0, 3).map(({ title, explanation, evidenceRefs }) => ({ title, explanation, evidenceRefs })),
      reservations: report.issues.slice(0, 3).map(({ title, explanation, evidenceRefs }) => ({
        title, explanation, evidenceRefs, kind: evidenceRefs.length ? "evidence" as const : "gap" as const,
      })),
      likelyInterviewQuestions: report.issues.slice(0, 3).map(({ title, whyItMatters, evidenceRefs }) => ({
        question: `Jak doprecyzujesz: ${title.toLocaleLowerCase("pl-PL")}?`,
        whyThisQuestion: whyItMatters,
        evidenceRefs,
      })),
    },
  };
}

export function toTeaser(report: CVReport): TeaserReport {
  const normalized = withRecruiterPerspective(report);
  const perspective = normalized.recruiterPerspective;
  return {
    version: normalized.version, locale: normalized.locale, document: normalized.document, summary: normalized.summary,
    recruiterPerspective: {
      profileSummary: perspective.profileSummary,
      seniorityAlignment: perspective.seniorityAlignment,
      seniorityAlignmentExplanation: perspective.seniorityAlignmentExplanation,
      counts: {
        positiveSignals: perspective.positiveSignals.length,
        reservations: perspective.reservations.length,
        likelyInterviewQuestions: perspective.likelyInterviewQuestions.length,
      },
    },
    recruiterSimulation: normalized.recruiterSimulation,
    categoryScores: normalized.categoryScores.map(({ key, label, score, weight }) => ({ key, label, score, weight, rationale: "Szczegółowe uzasadnienie dostępne w pełnym raporcie.", evidenceRefs: [] })),
    counts: { strengths: normalized.strengths.length, issues: normalized.issues.length, nextSteps: normalized.nextSteps.length },
    ats: { score: normalized.ats.score, findingCount: normalized.ats.findings.length },
  };
}
