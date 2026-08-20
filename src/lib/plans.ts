import type { Locale } from "@/lib/i18n";

export const plans = ["full_review", "job_match"] as const;
export type Plan = (typeof plans)[number];
export type Market = "pl" | "en";

type PlanDefinition = {
  plan: Plan;
  market: Market;
  locale: Locale;
  amountMinor: number;
  currency: "PLN" | "EUR";
  stripePriceEnv: "STRIPE_PRICE_FULL_REVIEW" | "STRIPE_PRICE_JOB_MATCH" | "STRIPE_PRICE_FULL_REVIEW_EUR" | "STRIPE_PRICE_JOB_MATCH_EUR";
};

export const PLAN_CATALOG: Record<Market, Record<Plan, PlanDefinition>> = {
  pl: {
    full_review: { plan: "full_review", market: "pl", locale: "pl", amountMinor: 2900, currency: "PLN", stripePriceEnv: "STRIPE_PRICE_FULL_REVIEW" },
    job_match: { plan: "job_match", market: "pl", locale: "pl", amountMinor: 3900, currency: "PLN", stripePriceEnv: "STRIPE_PRICE_JOB_MATCH" },
  },
  en: {
    full_review: { plan: "full_review", market: "en", locale: "en", amountMinor: 900, currency: "EUR", stripePriceEnv: "STRIPE_PRICE_FULL_REVIEW_EUR" },
    job_match: { plan: "job_match", market: "en", locale: "en", amountMinor: 1200, currency: "EUR", stripePriceEnv: "STRIPE_PRICE_JOB_MATCH_EUR" },
  },
};

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && plans.includes(value as Plan);
}

export function marketForLocale(locale: Locale): Market {
  return locale === "en" ? "en" : "pl";
}

export function getPlanDefinition(plan: Plan, locale: Locale): PlanDefinition {
  return PLAN_CATALOG[marketForLocale(locale)][plan];
}

export function formatPlanPrice(plan: Plan, locale: Locale): string {
  const definition = getPlanDefinition(plan, locale);
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-IE", {
    style: "currency",
    currency: definition.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(definition.amountMinor / 100);
}

// Market reference for the price anchor shown on the pricing section and the
// paywall. It is a third-party market range for a professional CV rewrite, not
// a former price of ours, so it must stay conservative and verifiable — the
// whole product argument is that we do not overclaim. One place to update it.
//
// Sourced from the Polish market: a freelance copywriter rewrite runs
// PLN 100-250, a professional CV/career-advisory firm PLN 250-400 (or more).
// The combined span is what a buyer actually faces choosing between the two,
// so PLN 100-400 is the anchor, not either segment alone.
// EUR figure is that PLN range converted (~4.3 PLN/EUR), not an
// independently sourced EU-market rate.
export const REWRITE_SERVICE_REFERENCE: Record<Market, string> = {
  pl: "100–400 zł",
  en: "€25–90",
};
