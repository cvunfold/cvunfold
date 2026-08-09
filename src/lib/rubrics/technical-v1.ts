import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

export type Seniority = "junior" | "mid" | "senior" | "lead" | "auto";
export type RubricCategory = { key: string; label: string; weight: number };

const commonLabels: Record<string, string> = {
  impact: "Wpływ i rezultaty",
  ownership: "Ownership i odpowiedzialność",
  collaboration: "Współpraca",
  clarity: "Jasność i hierarchia sygnałów",
  ats: "ATS / higiena dokumentu",
};
const commonLabelsEn: Record<string, string> = {
  impact: "Impact and outcomes",
  ownership: "Ownership and responsibility",
  collaboration: "Collaboration",
  clarity: "Clarity and signal hierarchy",
  ats: "ATS / document hygiene",
};

const weights: Record<Exclude<Seniority, "auto">, Record<string, number>> = {
  junior: { impact: .10, ownership: .08, credibility: .25, architecture: .05, collaboration: .15, clarity: .27, ats: .10 },
  mid: { impact: .17, ownership: .16, credibility: .25, architecture: .10, collaboration: .10, clarity: .15, ats: .07 },
  senior: { impact: .22, ownership: .22, credibility: .18, architecture: .16, collaboration: .10, clarity: .08, ats: .04 },
  lead: { impact: .20, ownership: .22, credibility: .12, architecture: .22, collaboration: .17, clarity: .05, ats: .02 },
};

export const RUBRIC_VERSION = "technical-v1.0.0";

export function getRubric(seniority: Seniority, targetRole: TargetRoleId = "frontend_developer", locale: Locale = "pl"): RubricCategory[] {
  const resolved = seniority === "auto" ? "senior" : seniority;
  const role = getTargetRoleProfile(targetRole, locale);
  const labels: Record<string, string> = { ...(locale === "en" ? commonLabelsEn : commonLabels), credibility: role.credibilityLabel, architecture: role.systemsLabel };
  return Object.entries(weights[resolved]).map(([key, weight]) => ({ key, weight, label: labels[key] }));
}
