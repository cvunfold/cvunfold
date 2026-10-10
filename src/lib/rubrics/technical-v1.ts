import type { CareerContext } from "@/lib/ai/career-context";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

export const SENIORITIES = ["first_job", "junior", "mid", "senior", "lead", "auto"] as const;
export type Seniority = (typeof SENIORITIES)[number];
export type RubricCategory = { key: string; label: string; weight: number };

const commonLabels: Record<string, string> = {
  impact: "Wpływ i rezultaty",
  ownership: "Ownership i odpowiedzialność",
  collaboration: "Współpraca",
  clarity: "Jasność i hierarchia sygnałów",
};
const commonLabelsEn: Record<string, string> = {
  impact: "Impact and outcomes",
  ownership: "Ownership and responsibility",
  collaboration: "Collaboration",
  clarity: "Clarity and signal hierarchy",
};

// ats was removed and its weight redistributed proportionally across the
// remaining categories in each row (each row still sums to 1). Document
// hygiene is now the deterministic checker in @/lib/ats-checker, shown
// alongside the report rather than folded into overallScore.
const weights: Record<Exclude<Seniority, "auto">, Record<string, number>> = {
  first_job: { impact: .15, ownership: .15, credibility: .35, architecture: .05, collaboration: .05, clarity: .25 },
  junior: { impact: .11, ownership: .09, credibility: .28, architecture: .05, collaboration: .17, clarity: .30 },
  mid: { impact: .18, ownership: .17, credibility: .27, architecture: .11, collaboration: .11, clarity: .16 },
  senior: { impact: .23, ownership: .23, credibility: .19, architecture: .17, collaboration: .10, clarity: .08 },
  lead: { impact: .20, ownership: .23, credibility: .12, architecture: .23, collaboration: .17, clarity: .05 },
};

const genericAutoWeights: Record<string, number> = {
  impact: .22,
  ownership: .19,
  credibility: .19,
  architecture: .13,
  collaboration: .13,
  clarity: .14,
};

export const RUBRIC_VERSION = "technical-v1.5.0";

export function parseSeniority(value: unknown): Seniority | null {
  return SENIORITIES.includes(value as Seniority) ? value as Seniority : null;
}

// "auto" used to resolve to senior, so anyone who answered "I do not know, judge
// from my CV" was scored as a senior: ownership at .23 instead of .09 and clarity
// at .08 instead of .30. A junior was then told their ownership and impact were
// missing — true, and useless, because those are facts of career stage rather than
// fixable document problems. Auto now carries neutral weights into the request, and
// the real profile is applied afterwards from the seniority the model perceived.
export function getRubric(seniority: Seniority, targetRole: TargetRoleId = "frontend_developer", locale: Locale = "pl", careerContext: CareerContext = "standard"): RubricCategory[] {
  const role = getTargetRoleProfile(targetRole, locale);
  const labels: Record<string, string> = { ...(locale === "en" ? commonLabelsEn : commonLabels), credibility: role.credibilityLabel, architecture: role.systemsLabel };
  const early = seniority === "first_job" || seniority === "junior" || (seniority === "auto" && careerContext !== "standard");
  if (early) Object.assign(labels, locale === "pl" ? {
    impact: "Co robią projekty i jak działają", ownership: "Twój wkład w projekty", credibility: role.experimental ? "Podstawy i praktyka" : "Podstawy techniczne i praktyka",
    architecture: "Struktura projektu i decyzje", collaboration: "Współpraca i korzystanie z feedbacku", clarity: "Czytelność CV i opis projektów",
  } : {
    impact: "Project functionality and quality", ownership: "Your project contribution", credibility: role.experimental ? "Fundamentals and practice" : "Technical fundamentals and practice",
    architecture: "Project structure and decisions", collaboration: "Collaboration and use of feedback", clarity: "CV clarity and project descriptions",
  });
  else if (seniority === "mid") Object.assign(labels, locale === "pl" ? {
    impact: "Efekty dostarczonych rozwiązań", ownership: "Samodzielność i zakres zadań", architecture: "Decyzje techniczne i struktura rozwiązań",
  } : {
    impact: "Delivered outcomes", ownership: "Independence and scope of work", architecture: "Technical decisions and solution structure",
  });
  const selectedWeights = seniority === "auto" ? genericAutoWeights : weights[seniority];
  return Object.entries(selectedWeights).map(([key, weight]) => ({ key, weight, label: labels[key] }));
}

// Only the four real levels can pick a weight profile; "unclear" keeps the neutral
// one, which is the honest answer when the document does not settle the question.
export function scoringSeniority(selected: Seniority, perceived: string): Seniority {
  if (selected !== "auto") return selected;
  return perceived === "junior" || perceived === "mid" || perceived === "senior" || perceived === "lead" ? perceived : "auto";
}
