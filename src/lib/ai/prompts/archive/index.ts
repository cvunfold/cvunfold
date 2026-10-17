import type { Seniority } from "@/lib/rubrics/technical-v1";
import type { CareerContext } from "./career-context-v2";
import { careerPolicy, CAREER_POLICY_VERSION } from "./career-context-v2";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./review-pl-v3";
import { EN_PROMPT_VERSION, EN_SYSTEM_PROMPT } from "./review-en-v1";
import { EN2_PROMPT_VERSION, EN2_SYSTEM_PROMPT } from "./review-en-v2";
import { EN3_PROMPT_VERSION, EN3_SYSTEM_PROMPT } from "./review-en-v3";
import { PL_RC_PROMPT_VERSION, PL_RC_SYSTEM_PROMPT } from "./review-pl-v1_6-rc1";
import { PL_RC2_PROMPT_VERSION, PL_RC2_SYSTEM_PROMPT } from "./review-pl-v1_6-rc2";
import { PL_RC3_PROMPT_VERSION, PL_RC3_SYSTEM_PROMPT } from "./review-pl-v1_6-rc3";
import { PL_RC4_PROMPT_VERSION, PL_RC4_SYSTEM_PROMPT } from "./review-pl-v1_6-rc4";
import type { Locale } from "@/lib/i18n";

// The single place that decides which review prompt is live. Every recorded
// promptVersion originates here, so a stored report can always be traced back to
// the exact wording that produced it.
export const REVIEW_PROMPT_VARIANTS = ["stable", "v1.6-rc1", "v1.6-rc2", "v1.6-rc3", "v1.6-rc4"] as const;
export type ReviewPromptVariant = (typeof REVIEW_PROMPT_VARIANTS)[number];

export type ResolvedReviewPrompt = {
  version: string;
  systemPrompt: string;
  variant: ReviewPromptVariant;
};

export function activeArchivedPromptVariant(): ReviewPromptVariant {
  const requested = process.env.CV_REVIEW_PROMPT_VARIANT?.trim();
  return REVIEW_PROMPT_VARIANTS.includes(requested as ReviewPromptVariant)
    ? requested as ReviewPromptVariant
    : "stable";
}

function getBaseReviewPrompt(locale: Locale): ResolvedReviewPrompt {
  const variant = activeArchivedPromptVariant();
  if (locale === "en") {
    // v1.6-rc1/rc2 were Polish-only canaries, deliberately: English stayed on
    // its stable prompt so each measured the Polish rewrite alone. rc3 is where
    // review-en-v2 catches up, so from rc3 onward both locales move together
    // under the same variant selector.
    if (variant === "v1.6-rc4") return { version: EN3_PROMPT_VERSION, systemPrompt: EN3_SYSTEM_PROMPT, variant };
    if (variant === "v1.6-rc3") return { version: EN2_PROMPT_VERSION, systemPrompt: EN2_SYSTEM_PROMPT, variant };
    return { version: EN_PROMPT_VERSION, systemPrompt: EN_SYSTEM_PROMPT, variant: "stable" };
  }
  if (variant === "v1.6-rc4") return { version: PL_RC4_PROMPT_VERSION, systemPrompt: PL_RC4_SYSTEM_PROMPT, variant };
  if (variant === "v1.6-rc3") return { version: PL_RC3_PROMPT_VERSION, systemPrompt: PL_RC3_SYSTEM_PROMPT, variant };
  if (variant === "v1.6-rc2") return { version: PL_RC2_PROMPT_VERSION, systemPrompt: PL_RC2_SYSTEM_PROMPT, variant };
  if (variant === "v1.6-rc1") return { version: PL_RC_PROMPT_VERSION, systemPrompt: PL_RC_SYSTEM_PROMPT, variant };
  return { version: PROMPT_VERSION, systemPrompt: SYSTEM_PROMPT, variant: "stable" };
}

export function getArchivedReviewPrompt(locale: Locale, seniority: Seniority = "auto", context: CareerContext = "standard"): ResolvedReviewPrompt {
  const base = getBaseReviewPrompt(locale);
  const stage = (seniority === "auto" || seniority === "junior") && context === "first_job" ? "first_job" : seniority;
  const shared = base.systemPrompt.replace(/\n2\. (?:OCZEKIWANIA WEDŁUG POZIOMU|EXPECTATIONS BY LEVEL)[\s\S]*?(?=\n3\.)/, "\n");
  return { ...base, version: `${base.version}+${CAREER_POLICY_VERSION}:${stage}`, systemPrompt: `${shared}\n\n${careerPolicy(locale, stage)}` };
}
