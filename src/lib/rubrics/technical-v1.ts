import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

export const SENIORITIES = ["junior", "mid", "senior", "lead", "auto"] as const;
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

export const RUBRIC_VERSION = "technical-v1.2.0";

export function parseSeniority(value: unknown): Seniority | null {
  return SENIORITIES.includes(value as Seniority) ? value as Seniority : null;
}

export function getRubric(seniority: Seniority, targetRole: TargetRoleId = "frontend_developer", locale: Locale = "pl"): RubricCategory[] {
  const resolved = seniority === "auto" ? "senior" : seniority;
  const role = getTargetRoleProfile(targetRole, locale);
  const labels: Record<string, string> = { ...(locale === "en" ? commonLabelsEn : commonLabels), credibility: role.credibilityLabel, architecture: role.systemsLabel };
  const selectedWeights = seniority === "auto" && role.experimental ? genericAutoWeights : weights[resolved];
  return Object.entries(selectedWeights).map(([key, weight]) => ({ key, weight, label: labels[key] }));
}
