import type { Article } from "@/lib/content/articles";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";

export const SITE_NAME = brand.name;
export const SITE_URL = brand.siteUrl;
export const SITE_LOCALE = "pl_PL";
export const SITE_LANGUAGE = "pl-PL";
export const SITE_DESCRIPTION = "Analiza CV oczami rekrutera: sprawdź seniority, ownership, wpływ i wiarygodność techniczną na podstawie dowodów z dokumentu.";
export const SITE_LAST_SIGNIFICANT_UPDATE = "2026-08-10";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const AUTHOR_ID = `${SITE_URL}/#pawel-maczka-czarnecki`;

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function articleWordCount(article: Article): number {
  const text = [
    article.title,
    article.intro,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.example ? [section.example.before, section.example.after, section.example.note] : []),
    ]),
    ...article.checklist,
  ].join(" ");
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function articleImageUrl(article: Article, locale: Locale = "pl"): string {
  void article;
  void locale;
  return absoluteUrl("/opengraph-image");
}

export function buildArticleStructuredData(article: Article, locale: Locale = "pl") {
  const basePath = locale === "pl" ? "/artykuly" : "/en/articles";
  const articleUrl = absoluteUrl(`${basePath}/${article.slug}`);
  const articlesUrl = absoluteUrl(basePath);
  const language = locale === "pl" ? "pl-PL" : "en";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: article.title,
        description: article.description,
        articleSection: article.category,
        image: [articleImageUrl(article, locale)],
        datePublished: `${article.publishedAt}T09:00:00+02:00`,
        dateModified: `${article.updatedAt ?? article.publishedAt}T09:00:00+02:00`,
        inLanguage: language,
        isAccessibleForFree: true,
        wordCount: articleWordCount(article),
        mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
        author: { "@type": "Person", "@id": AUTHOR_ID, name: "Paweł Mączka-Czarnecki", url: absoluteUrl(locale === "pl" ? "/o-metodologii" : "/en/methodology") },
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "WebPage",
        "@id": `${articleUrl}#webpage`,
        url: articleUrl,
        name: article.title,
        description: article.description,
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": `${articleUrl}#breadcrumb` },
        primaryImageOfPage: { "@type": "ImageObject", url: articleImageUrl(article, locale) },
        inLanguage: language,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: locale === "pl" ? "Strona główna" : "Home", item: absoluteUrl(locale === "pl" ? "/" : "/en") },
          { "@type": "ListItem", position: 2, name: locale === "pl" ? "Artykuły" : "Articles", item: articlesUrl },
          { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
        ],
      },
    ],
  };
}
