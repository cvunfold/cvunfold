import type { ModelReport } from "./schemas/report";

export const NO_EVIDENCE_SCORE = 20;
export const REPORT_POLICY_VERSION = "evidence-priority-v1.3";

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

export function normalizeDiagnosticKind(issue: ModelReport["issues"][number], validRefs: Set<string>, locale: ModelReport["locale"]) {
  const verificationEvidenceRefs = (issue.verificationEvidenceRefs || []).filter(ref => validRefs.has(ref));
  const allowedVerificationCategory = issue.category === "credibility" || issue.category === "impact";
  if (issue.diagnosticKind === "missing_verification" || issue.diagnosticKind === "limited_verification") {
    if (!allowedVerificationCategory) return { ...issue, diagnosticKind: "other" as const, verificationEvidenceRefs: [] };
    if (verificationEvidenceRefs.length && issue.diagnosticKind === "missing_verification") return {
      ...issue, diagnosticKind: "limited_verification" as const, verificationEvidenceRefs, evidenceRefs: verificationEvidenceRefs,
      title: locale === "pl" ? "Zakres weryfikacji projektu można doprecyzować" : "The project's verification scope could be clarified",
      explanation: locale === "pl" ? "CV zawiera informacje o sprawdzaniu projektu. Ta uwaga dotyczy tylko ewentualnych brakujących szczegółów zakresu sprawdzeń, nie braku całej weryfikacji." : "The CV describes checks of the project. This finding concerns potentially missing details of their scope, not an absence of verification.",
      whyItMatters: locale === "pl" ? "Opis zakresu już wykonanych sprawdzeń ułatwia ocenę praktyki widocznej w CV." : "Describing the scope of checks already performed makes the documented practice easier to assess.",
      action: locale === "pl" ? "Jeżeli wykonano inne rzeczywiste sprawdzenia tego projektu, dopisz ich zakres. Zachowaj opis już wykonanych kontroli." : "If other checks were actually performed on this project, describe their scope. Keep the information about the checks already performed.",
      suggestion: { type: "question" as const, original: null, proposed: null,
        factualityNote: locale === "pl" ? "Nie dopisuj nowych praktyk. Uzupełnij tylko prawdziwe brakujące szczegóły istniejącej weryfikacji." : "Do not invent practices. Add only accurate missing details about existing verification." },
    };
    if (!verificationEvidenceRefs.length && issue.diagnosticKind === "limited_verification") return { ...issue, diagnosticKind: "missing_verification" as const, verificationEvidenceRefs, severity: issue.severity === "critical" ? "critical" as const : "important" as const };
  }
  return { ...issue, verificationEvidenceRefs };
}

export function prioritizeFirstJobIssues(issues: ModelReport["issues"], categories: ModelReport["categoryScores"]) {
  const own = categories.find(category => category.key === "ownership");
  const concreteContribution = own?.evidenceStatus === "concrete" && own.evidenceRefs.length > 0;
  const severity = { critical: 3, important: 2, minor: 1 };
  const actionable = { unattributed_contribution: 4, missing_verification: 3, limited_verification: 0, other: 2, weak_exposure: 1, limited_contribution: 0 };
  return issues.map((issue, index) => ({
    index,
    issue: issue.diagnosticKind === "limited_verification" && issue.verificationEvidenceRefs?.length
      ? { ...issue, severity: issue.severity === "critical" ? "critical" as const : "minor" as const }
      : issue.diagnosticKind === "limited_contribution"
      ? concreteContribution
        ? { ...issue, severity: "minor" as const }
        : { ...issue, diagnosticKind: "unattributed_contribution" as const, severity: issue.severity === "critical" ? "critical" as const : "important" as const }
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
