export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export const languageMeta = {
  pl: { htmlLang: "pl", ogLocale: "pl_PL", label: "Polski", shortLabel: "PL" },
  en: { htmlLang: "en", ogLocale: "en_US", label: "English", shortLabel: "EN" },
} as const;

export function homePath(locale: Locale): string {
  return locale === "pl" ? "/" : "/en";
}

export function analysisPath(locale: Locale, withJob = false): string {
  const path = locale === "pl" ? "/analiza" : "/en/analysis";
  return withJob ? `${path}?job=1` : path;
}

export function sampleReportPath(locale: Locale): string {
  return locale === "pl" ? "/przykladowy-raport" : "/en/sample-report";
}

export function articlesPath(locale: Locale): string {
  return locale === "pl" ? "/artykuly" : "/en/articles";
}

export function reportPath(locale: Locale): string {
  return locale === "pl" ? "/raport" : "/en/report";
}

export function legalPath(locale: Locale, page: "terms" | "privacy" | "cookies" | "delete" | "contact"): string {
  const paths = {
    pl: { terms: "/regulamin", privacy: "/polityka-prywatnosci", cookies: "/cookies", delete: "/usun-dane", contact: "/kontakt" },
    en: { terms: "/en/terms", privacy: "/en/privacy", cookies: "/en/cookies", delete: "/en/delete-data", contact: "/en/contact" },
  } as const;
  return paths[locale][page];
}

export const commonCopy = {
  pl: {
    home: "Strona główna",
    articles: "Artykuły",
    sampleReport: "Przykładowy raport",
    analyze: "Sprawdź CV",
    languageSwitch: "Read in English",
    reportNotPerson: "Oceniamy sposób przedstawienia doświadczenia w dokumencie, nie Ciebie jako osoby.",
  },
  en: {
    home: "Home",
    articles: "Articles",
    sampleReport: "Sample report",
    analyze: "Review my CV",
    languageSwitch: "Czytaj po polsku",
    reportNotPerson: "We assess how your experience is presented in the document, not you as a person.",
  },
} as const;
