import type { CVReport } from "./schemas/report";

export type CareerQualityExpectation = {
  perceivedLevels?: CVReport["document"]["perceivedSeniority"][];
  minimumScore?: number;
  maximumScore?: number;
  forbiddenAdvice?: string[];
};

// Pattern checks are regression tripwires, not a semantic judge. Human review
// of actual model output remains required, especially for factual rewrites.
export function evaluateCareerQuality(report: CVReport, expected: CareerQualityExpectation) {
  const advice = [
    ...report.issues.flatMap(issue => [issue.title, issue.explanation, issue.whyItMatters, issue.action, issue.suggestion?.proposed || "", issue.suggestion?.factualityNote || ""]),
    ...report.recruiterPerspective.reservations.flatMap(item => [item.title, item.explanation]),
    ...report.nextSteps.flatMap(item => [item.title, item.action]),
    ...report.recruiterSimulation.whatCouldImproveDecision,
  ].join("\n");
  return [
    ...(expected.perceivedLevels ? [{ name: "career: perceived level matches evidence", pass: expected.perceivedLevels.includes(report.document.perceivedSeniority) }] : []),
    ...(expected.minimumScore !== undefined ? [{ name: "career: strong evidence has no career-stage score ceiling", pass: report.summary.overallScore >= expected.minimumScore }] : []),
    ...(expected.maximumScore !== undefined ? [{ name: "career: declarations do not earn a strong score", pass: report.summary.overallScore <= expected.maximumScore }] : []),
    ...(expected.forbiddenAdvice || []).map(pattern => ({ name: `career: no inappropriate advice (${pattern})`, pass: !new RegExp(pattern, "iu").test(advice) })),
  ];
}

export const EARLY_CAREER_FORBIDDEN_ADVICE = [
  "(?:brak|brakuje|missing|lack of|no)\\s+(?:doświadczenia komercyjnego|commercial experience)",
  "(?:dodaj|pokaż|wykaż|add|show|demonstrate|missing|brak)\\s+(?:mentoring|mentoringu|wpływ organizacyjny|organisation.wide impact|organizational impact)",
  "(?:dodaj|pokaż|add|show)\\s+(?:przychody|revenue|liczbę klientów|customer counts)",
];
