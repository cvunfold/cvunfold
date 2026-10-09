import type { Seniority } from "@/lib/rubrics/technical-v1";
import { firstJobPrompt } from "./prompts/stages/first-job";
import { juniorPrompt } from "./prompts/stages/junior";
import { midPrompt } from "./prompts/stages/mid";
import { seniorPrompt } from "./prompts/stages/senior";
import { leadPrompt } from "./prompts/stages/lead";
import { autoPrompt } from "./prompts/stages/auto";
const stagePrompts = { first_job: firstJobPrompt, junior: juniorPrompt, mid: midPrompt, senior: seniorPrompt, lead: leadPrompt, auto: autoPrompt };
import type { Locale } from "@/lib/i18n";

export const CAREER_CONTEXTS = ["standard", "first_job"] as const;
export type CareerContext = (typeof CAREER_CONTEXTS)[number];
export const CAREER_POLICY_VERSION = "career-v2.0.0";

export function parseCareerContext(value: unknown): CareerContext | null {
  if (value === "bootcamp") return "first_job";
  return CAREER_CONTEXTS.includes(value as CareerContext) ? value as CareerContext : null;
}

export const careerContextLabels: Record<Locale, Record<CareerContext, string>> = {
  pl: { standard: "Standardowy", first_job: "Pierwsza praca w IT" },
  en: { standard: "Standard", first_job: "First job in tech" },
};

// Shared evidence safety plus exactly one selected stage module.
export function careerPolicy(locale: Locale, stage: Seniority = "auto"): string {
  const common = locale === "pl" ? `KALIBRACJA ETAPU KARIERY (${CAREER_POLICY_VERSION})
Zasady wybranego etapu mają pierwszeństwo nad ogólnymi przykładami i kalibracją powyżej. Wynik opisuje jakość dowodów w CV względem celu aplikacji, nie kompetencje osoby. Brak dowodu nie jest dowodem braku umiejętności. Oceniaj każdą kategorię według rubric. Nie wymagaj sygnałów poziomu wyższego niż wybrany.
Akceptuj konkretne efekty jakościowe; nie wymyślaj metryk, faktów, samodzielności ani rezultatów. Nie otwieraj linków i nie twierdź, że sprawdzono repozytorium. Nie twórz sztucznych problemów dla wypełnienia list. Zalecenia i pytania mają dotyczyć istniejących dowodów lub jasno nazwanych braków informacji.
`
    : `CAREER STAGE CALIBRATION (${CAREER_POLICY_VERSION})
Selected-stage rules take precedence over generic examples and calibration above. Scores describe CV evidence quality against the application target, not real competence. Missing evidence does not prove missing skill. Assess every category using the rubric. Do not require signals beyond the selected level.
Accept concrete qualitative outcomes; do not invent metrics, facts, independence or results. Do not open links or claim repository verification. Do not manufacture issues to fill lists. Recommendations and questions must follow existing evidence or explicitly missing information.
`;
  return common + stagePrompts[stage][locale];
}
