export type Seniority = "junior" | "mid" | "senior" | "lead" | "auto";
export type RubricCategory = { key: string; label: string; weight: number };

const labels: Record<string, string> = {
  impact: "Wpływ i rezultaty", ownership: "Ownership", credibility: "Wiarygodność techniczna",
  architecture: "Architektura i myślenie systemowe", collaboration: "Współpraca",
  clarity: "Jasność przekazu", ats: "ATS i struktura",
};

const weights: Record<Exclude<Seniority, "auto">, Record<string, number>> = {
  junior: { impact: .10, ownership: .10, credibility: .25, architecture: .05, collaboration: .15, clarity: .20, ats: .15 },
  mid: { impact: .15, ownership: .15, credibility: .25, architecture: .10, collaboration: .10, clarity: .15, ats: .10 },
  senior: { impact: .20, ownership: .20, credibility: .20, architecture: .15, collaboration: .10, clarity: .10, ats: .05 },
  lead: { impact: .20, ownership: .20, credibility: .15, architecture: .20, collaboration: .15, clarity: .07, ats: .03 },
};

export const RUBRIC_VERSION = "frontend-v1.0.0";

export function getRubric(seniority: Seniority): RubricCategory[] {
  const resolved = seniority === "auto" ? "senior" : seniority;
  return Object.entries(weights[resolved]).map(([key, weight]) => ({ key, weight, label: labels[key] }));
}
