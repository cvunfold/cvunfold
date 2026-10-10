import { NO_EVIDENCE_SCORE } from "./report-policy";
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
export const CAREER_POLICY_VERSION = "career-v2.2.0";

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
  const scoring = locale === "pl" ? `
DOWODY I STAŁA PUNKTACJA
Dla każdej kategorii zwróć evidenceStatus: none (brak użytecznego dowodu), indirect (pośredni dowód) albo concrete (konkretny dowód). Przy none używaj pustych evidenceRefs i dokładnie ${NO_EVIDENCE_SCORE}/100. Przy indirect lub concrete cytuj istniejący dowód właściwy dla tej kategorii. Backend ustala stałą punktację none. Nie przyznawaj punktów współpracy za samodzielną implementację ani za samą obecność bootcampu lub kursu. Współpraca wymaga konkretnego zdarzenia pracy z innymi osobami lub feedbacku.
Każdy issue ma diagnosticKind: unattributed_contribution, limited_contribution, weak_exposure, missing_verification, limited_verification lub other. missing_verification dotyczy wyłącznie braku sprawdzania działania projektu (impact/credibility), nigdy braku dowodu współpracy. limited_verification oznacza opisane sprawdzenia z ograniczonym zakresem. verificationEvidenceRefs muszą wskazywać opisane sprawdzenia tego samego projektu; sama funkcjonalność nie jest sprawdzeniem. Inne luki klasyfikuj jako other. Brak jednoznacznego własnego wkładu oznacz unattributed_contribution, a nie minor/limited_contribution. Mały, ale konkretnie przypisany fragment oznacz concrete dla ownershipu; concrete nie oznacza dużej skali.
Odróżniaj brak przypisania wkładu od znanego, ale niewielkiego zakresu; nie nazywaj luki jakościowej problemem ownershipu. Każdy nextStep i każda recruiterPerspective.reservation musi mieć issueId istniejącego issue.
`
    : `
EVIDENCE AND FIXED SCORING
For each category return evidenceStatus: none (no useful evidence), indirect (indirect evidence), or concrete (specific evidence). For none use empty evidenceRefs and exactly ${NO_EVIDENCE_SCORE}/100. For indirect/concrete cite existing evidence relevant to that category. The server fixes none scores. Independent implementation and merely attending a bootcamp/course are not collaboration evidence. Collaboration requires a specific event involving other people or feedback.
Every issue has diagnosticKind: unattributed_contribution, limited_contribution, weak_exposure, missing_verification, limited_verification or other. missing_verification is only about absent project checks (impact/credibility), never missing collaboration evidence. limited_verification means described checks with limited scope. verificationEvidenceRefs must point to the described checks of the same project; functionality alone is not checking. Classify other gaps as other. Unclear personal contribution is unattributed_contribution, not minor/limited_contribution. A small specifically attributed contribution is concrete for ownership; concrete does not mean large scope.
Distinguish unattributed work from known but small scope; do not classify a quality-evidence gap as ownership. Every nextStep and recruiterPerspective.reservation must have the issueId of an existing issue.
`;
  return common + scoring + stagePrompts[stage][locale];
}
