import type { ModelReport } from "./schemas/report";

export const NO_EVIDENCE_SCORE = 20;
export const REPORT_POLICY_VERSION = "evidence-priority-v1";

export function normalizeCategoryEvidence(category: ModelReport["categoryScores"][number], validRefs: Set<string>, locale: ModelReport["locale"]) {
  const refs = category.evidenceRefs.filter(ref => validRefs.has(ref));
  const absent = category.evidenceStatus === "none" || refs.length === 0;
  if (!absent) return { ...category, evidenceRefs: refs };
  return {
    ...category, evidenceStatus: "none" as const, score: NO_EVIDENCE_SCORE, evidenceRefs: [],
    rationale: locale === "pl"
      ? "Brak widocznych dowodów w tej kategorii. Stałe 20/100 oznacza brak informacji w dokumencie, nie brak umiejętności osoby."
      : "No visible evidence in this category. The fixed 20/100 marks missing information in the document, not missing personal skill.",
  };
}

export function prioritizeFirstJobIssues(issues: ModelReport["issues"], categories: ModelReport["categoryScores"]) {
  const own = categories.find(category => category.key === "ownership");
  const concreteContribution = own?.evidenceStatus === "concrete" && own.evidenceRefs.length > 0;
  const severity = { critical: 3, important: 2, minor: 1 };
  const actionable = { unattributed_contribution: 4, missing_verification: 3, other: 2, weak_exposure: 1, limited_contribution: 0 };
  return issues.map((issue, index) => ({
    index,
    issue: concreteContribution && issue.diagnosticKind === "limited_contribution"
      ? { ...issue, severity: "minor" as const }
      : issue,
  })).sort((a, b) => severity[b.issue.severity] - severity[a.issue.severity]
    || actionable[b.issue.diagnosticKind || "other"] - actionable[a.issue.diagnosticKind || "other"]
    || a.index - b.index).map(item => item.issue);
}

export function alignNextSteps(steps: ModelReport["nextSteps"], issues: ModelReport["issues"]) {
  // Legacy objects without links preserve their historical order. New linked
  // actions follow the final issue order and cannot point to filtered findings.
  if (!steps.some(step => step.issueId !== undefined)) return steps;
  const positions = new Map(issues.map((issue, index) => [issue.id, index]));
  return steps.filter(step => step.issueId && positions.has(step.issueId))
    .map((step, index) => ({ step, index }))
    .sort((a, b) => positions.get(a.step.issueId!)! - positions.get(b.step.issueId!)! || a.index - b.index)
    .map(({ step }, index) => ({ ...step, priority: index + 1 }));
}
