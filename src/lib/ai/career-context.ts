import type { Seniority } from "@/lib/rubrics/technical-v1";
import { STAGE_POLICIES, STAGE_POLICY_VERSION } from "./prompts/stages";
import type { Locale } from "@/lib/i18n";

export const CAREER_CONTEXTS = ["standard", "first_job"] as const;
export type CareerContext = (typeof CAREER_CONTEXTS)[number];
export const CAREER_POLICY_VERSION = STAGE_POLICY_VERSION;

export function parseCareerContext(value: unknown): CareerContext | null {
  if (value === "bootcamp") return "first_job";
  return CAREER_CONTEXTS.includes(value as CareerContext) ? value as CareerContext : null;
}

export const careerContextLabels: Record<Locale, Record<CareerContext, string>> = {
  pl: { standard: "Standardowy", first_job: "Pierwsza praca w IT" },
  en: { standard: "Standard", first_job: "First job in tech" },
};

// Compatibility helper for callers displaying stage policy. Semantic rules are
// shared across languages; language rendering is composed separately.
export function careerPolicy(_locale: Locale, stage: Seniority = "auto"): string {
  void _locale;
  return `# Selected stage: ${stage}\n${STAGE_POLICIES[stage]}`;
}
