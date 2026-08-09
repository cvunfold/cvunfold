export type Seniority = "junior" | "mid" | "senior" | "lead" | "auto";
export type RubricCategory = { key: string; label: string; weight: number };

const labels: Record<string, string> = {
  impact: "Wpływ i rezultaty", ownership: "Ownership i odpowiedzialność", credibility: "Wiarygodność techniczna",
  architecture: "Architektura i myślenie systemowe", collaboration: "Współpraca",
  clarity: "Jasność i hierarchia sygnałów", ats: "ATS / higiena dokumentu",
};

const weights: Record<Exclude<Seniority, "auto">, Record<string, number>> = {
  junior: { impact: .10, ownership: .08, credibility: .25, architecture: .05, collaboration: .15, clarity: .27, ats: .10 },
  mid: { impact: .17, ownership: .16, credibility: .25, architecture: .10, collaboration: .10, clarity: .15, ats: .07 },
  senior: { impact: .22, ownership: .22, credibility: .18, architecture: .16, collaboration: .10, clarity: .08, ats: .04 },
  lead: { impact: .20, ownership: .22, credibility: .12, architecture: .22, collaboration: .17, clarity: .05, ats: .02 },
};

export const RUBRIC_VERSION = "frontend-v2.0.0";

export function getRubric(seniority: Seniority): RubricCategory[] {
  const resolved = seniority === "auto" ? "senior" : seniority;
  return Object.entries(weights[resolved]).map(([key, weight]) => ({ key, weight, label: labels[key] }));
}
