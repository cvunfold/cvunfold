import type { CVReport } from "./schemas/report";
import { isWordingInstruction } from "./proposed-wording";

// Repositioning supported text needs no new candidate facts. Never restore a
// rejected draft: keep only an instruction to reuse the original CV evidence.
export function normalizeReportRecommendations(report: CVReport): CVReport {
  const issues = report.issues.map(raw => {
    const issue = raw.suggestion?.proposed && isWordingInstruction(raw.suggestion.proposed)
      ? { ...raw, suggestion: { ...raw.suggestion, proposed: null } }
      : raw;
    const supportedExposure = issue.category === "clarity"
      && issue.diagnosticKind === "weak_exposure"
      && issue.evidenceRefs.some(ref => report.evidenceMap?.[ref]?.trim())
      && (issue.suggestion?.type === "question"
        || (issue.suggestion?.type === "expose" && !issue.suggestion.proposed));
    if (!supportedExposure) return issue;
    return {
      ...issue,
      action: report.locale === "pl"
        ? "Wyeksponuj w profilu lub odpowiedniej sekcji najmocniejsze fakty już opisane w CV. Zachowaj ich przypisanie do projektu lub roli oraz informacje o pracy kursowej i wsparciu. Nie dodawaj nowych faktów."
        : "Highlight the strongest facts already described in the CV in the profile or relevant section. Preserve their attribution to the project or role and any course-work or support context. Do not add new facts.",
      suggestion: {
        type: "expose" as const,
        original: issue.suggestion?.original ?? null,
        proposed: null,
        factualityNote: report.locale === "pl"
          ? "Potrzebna jest zmiana ekspozycji istniejącej treści, bez pytania o fakty już podane w CV."
          : "Reposition the existing content without asking for facts already supplied in the CV.",
      },
    };
  });
  const byId = new Map(issues.map(issue => [issue.id, issue]));
  const nextSteps = report.nextSteps.map(step => {
    const issue = step.issueId ? byId.get(step.issueId) : undefined;
    if (!issue) return step;
    return { ...step, action: issue.action,
      title: step.action === issue.action ? step.title : issue.title };
  });
  return { ...report, issues, nextSteps };
}
