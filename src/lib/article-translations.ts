const plToEn = {
  "jak-nie-dac-sie-zastapic-przez-ai": "how-to-stay-relevant-in-the-age-of-ai",
  "dlaczego-ownership-jest-wazny-dla-pracodawcow": "why-ownership-matters-to-employers",
  "jak-pokazac-seniority-w-cv": "how-to-show-seniority-in-a-cv",
  "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw": "responsibilities-are-not-outcomes",
  "pierwsze-20-sekund-cv": "the-first-20-seconds-of-a-cv",
  "wiarygodnosc-techniczna-w-cv": "technical-credibility-in-a-developer-cv",
} as const;

const enToPl = Object.fromEntries(Object.entries(plToEn).map(([pl, en]) => [en, pl])) as Record<string, string>;

export function articleAlternates(slug: string, locale: "pl" | "en") {
  const plSlug = locale === "pl" ? slug : enToPl[slug];
  const enSlug = locale === "en" ? slug : plToEn[slug as keyof typeof plToEn];

  if (!plSlug || !enSlug) return undefined;

  return {
    "pl-PL": `/artykuly/${plSlug}`,
    en: `/en/articles/${enSlug}`,
    "x-default": `/artykuly/${plSlug}`,
  };
}
