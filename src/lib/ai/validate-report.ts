import type { CVReport, TeaserReport } from "./schemas/report";
import { reportSchema } from "./schemas/report";

export function calculateOverall(categories: CVReport["categoryScores"]): number {
  const weight = categories.reduce((sum, category) => sum + category.weight, 0);
  if (Math.abs(weight - 1) > 0.001) throw new Error("INVALID_RUBRIC_WEIGHTS");
  return Math.round(categories.reduce((sum, category) => sum + category.score * category.weight, 0));
}

export function validateEvidence(report: CVReport, validRefs: Set<string>): CVReport {
  const parsed = reportSchema.parse(report);
  const keep = (refs: string[]) => refs.filter((ref) => validRefs.has(ref));
  const categoryScores = parsed.categoryScores.map((category) => ({ ...category, evidenceRefs: keep(category.evidenceRefs) }));
  const strengths = parsed.strengths.filter((item) => keep(item.evidenceRefs).length > 0).map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  const issues = parsed.issues.filter((item) => item.suggestion?.type === "gap" || item.suggestion?.type === "question" || keep(item.evidenceRefs).length > 0)
    .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  return { ...parsed, categoryScores, strengths, issues, summary: { ...parsed.summary, overallScore: calculateOverall(categoryScores) } };
}

export function toTeaser(report: CVReport): TeaserReport {
  return {
    version: report.version, locale: report.locale, document: report.document, summary: report.summary,
    recruiterSimulation: report.recruiterSimulation,
    categoryScores: report.categoryScores.map(({ key, label, score, weight }) => ({ key, label, score, weight, rationale: "Szczegółowe uzasadnienie dostępne w pełnym raporcie.", evidenceRefs: [] })),
    counts: { strengths: report.strengths.length, issues: report.issues.length, nextSteps: report.nextSteps.length },
    ats: { score: report.ats.score, findingCount: report.ats.findings.length },
  };
}
