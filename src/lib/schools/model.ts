import type { SchoolUploadBatch, SchoolAnalysisTiming } from "./upload-model";
import type { RevisionSummary } from "@/lib/data/store";
import type { SchoolPackage } from "./package";
import type { SchoolContact } from "./contact";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import { getScoreThresholds } from "@/lib/rubrics/score-scale";

export type SchoolGroup = { id: string; name: string; target_role: string; target_seniority: string };
export type SchoolStudent = { id: string; name: string; contact?: SchoolContact; createdAt: string; expiresAt: string; paid: boolean; testAccess?: boolean; report: CVReport | null; initialReport?: CVReport; latestVersion?: number; comparisonKey?: string; sample?: { title: string; description: string; sourceText: string; sourceUrl: string; analyzedAt: string; displayUrl?: string; template?: string; revision?: { process?: "guided_self_edit"; model?: string; redaction?: { partial?: boolean; previousScore: number; oldProjectWords: number; newProjectWords: number; technicalRetry: boolean; note?: string }; createdAt: string; sourceUrl: string; sourceText: string; conversation?: { issueId: string; question: string; recommendation: string; answer: string; displayAnswer?: string }[]; brief?: string; analysis?: { before: CVReport; after: CVReport; beforeCreatedAt: string; afterCreatedAt: string }; changes: { title: string; before: string; after: string; note: string }[] } } };
export type SchoolData = { schoolName: string; groups: SchoolGroup[]; groupId: string | null; students: SchoolStudent[]; package?: SchoolPackage; testAccessExpiresAt?: string; backgroundUploadsEnabled?: boolean; batches?: SchoolUploadBatch[]; analysisTiming?: SchoolAnalysisTiming };
export type SchoolReport = { paid: boolean; fullAccess?: boolean; testAccess?: boolean; answerScope?: string; report: CVReport | TeaserReport; expiresAt: string; version?: number; demoRevisionPreview?: boolean; iterationsAvailable?: boolean; revisions?: RevisionSummary[]; rechecksRemaining?: number; recheckRunning?: boolean };
export type StudentSort = { key: "name" | "score"; direction: "asc" | "desc" };
const studentNameCollator = new Intl.Collator("pl", { sensitivity: "base", numeric: true });

export function sortSchoolStudents(students: SchoolStudent[], sort: StudentSort | null): SchoolStudent[] {
  if (!sort) return students;
  return [...students].sort((a, b) => {
    const names = studentNameCollator.compare(a.name, b.name);
    const direction = sort.direction === "asc" ? 1 : -1;
    if (sort.key === "name") return names * direction;
    const aScore = a.report?.summary.overallScore ?? null;
    const bScore = b.report?.summary.overallScore ?? null;
    // Missing scores always follow scored CVs, including when sorting ascending.
    if (aScore === null && bScore === null) return names;
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    return (aScore - bScore) * direction || names;
  });
}

export const categoryTopics: Record<string, string> = {
  ownership: "Opisz własny wkład w projekty", impact: "Pokaż rezultaty, które możesz potwierdzić",
  credibility: "Poprzyj technologie przykładami pracy", architecture: "Wyjaśnij decyzje techniczne",
  collaboration: "Opisz współpracę i swoją rolę", clarity: "Uporządkuj strukturę i język CV",
};

export function summarizeSchool(students: SchoolStudent[]) {
  const paid = students.filter((p): p is SchoolStudent & { report: CVReport } => (p.paid || p.testAccess === true) && p.report !== null);
  // A rubric change creates a separate comparison cohort, rather than a misleading mixed average.
  const cohorts = [...new Set(paid.map(p => `${p.comparisonKey || "legacy"}:${p.report.rubricVersion}:${p.report.promptVersion}:${p.report.document.targetRole}:${p.report.document.targetSeniority}`))];
  const comparable = cohorts.length <= 1;
  const thresholds = getScoreThresholds(paid[0]?.report.rubricVersion);
  const scores = paid.map(p => p.report.summary.overallScore).sort((a, b) => a - b);
  const count = scores.length;
  const average = count && comparable ? Math.round(scores.reduce((s, n) => s + n, 0) / count) : null;
  const averageStrengths = count && comparable ? paid.reduce((sum, p) => sum + p.report.strengths.length, 0) / count : null;
  const averageImportantIssues = count && comparable ? paid.reduce((sum, p) => sum + p.report.issues.filter(issue => issue.severity === "important" || issue.severity === "critical").length, 0) / count : null;
  const categories = comparable ? [...new Set(paid.flatMap(p => p.report.categoryScores.map(c => c.key)))].map(key => {
    const values = paid.flatMap(p => p.report.categoryScores.filter(c => c.key === key));
    return { key, label: values[0].label, score: Math.round(values.reduce((s, v) => s + v.score, 0) / values.length), count: values.length };
  }) : [];
  // Count each document once per stable issue category, never group arbitrary model titles.
  const problems = comparable ? Object.keys(categoryTopics).map(key => ({ key, label: categoryTopics[key],
    count: paid.filter(p => p.report.issues.some(i => i.category === key && i.severity !== "minor")).length,
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count) : [];
  const binLabels = [`Duże zmiany · poniżej ${thresholds.schoolRefinement}`, `Dopracowanie · ${thresholds.schoolRefinement}–${thresholds.schoolMinor - 1}`, `Drobne poprawki · ${thresholds.schoolMinor}–100`];
  const paired = paid.filter(p => (p.latestVersion || 0) > 0 && p.initialReport && p.initialReport.rubricVersion === p.report.rubricVersion && p.initialReport.promptVersion === p.report.promptVersion);
  const progress = paired.length && comparable ? { count: paired.length,
    before: Math.round(paired.reduce((sum,p) => sum + p.initialReport!.summary.overallScore,0) / paired.length),
    after: Math.round(paired.reduce((sum,p) => sum + p.report.summary.overallScore,0) / paired.length) } : null;
  const firstReports = paid.map(student => student.initialReport ?? student.report);
  const sameMethod = paid.every((student, index) => {
    const first = firstReports[index], current = student.report;
    return first.rubricVersion === current.rubricVersion && first.promptVersion === current.promptVersion
      && first.document.targetRole === current.document.targetRole && first.document.targetSeniority === current.document.targetSeniority;
  });
  // Same people and denominator for every metric, including candidates still on version zero.
  const baseline = count && comparable && sameMethod && paired.length ? {
    count,
    average: Math.round(firstReports.reduce((sum, report) => sum + report.summary.overallScore, 0) / count),
    averageStrengths: firstReports.reduce((sum, report) => sum + report.strengths.length, 0) / count,
    averageImportantIssues: firstReports.reduce((sum, report) => sum + report.issues.filter(issue => issue.severity === "important" || issue.severity === "critical").length, 0) / count,
  } : null;
  const secondAnalysisCount = paid.filter(student => (student.latestVersion || 0) > 0).length;
  return { count, average, progress, baseline, secondAnalysisCount, averageStrengths, averageImportantIssues, comparable, categories, problems, binLabels,
    bins: comparable ? [scores.filter(s => s < thresholds.schoolRefinement).length, scores.filter(s => s >= thresholds.schoolRefinement && s < thresholds.schoolMinor).length, scores.filter(s => s >= thresholds.schoolMinor).length] : [],
  };
}
