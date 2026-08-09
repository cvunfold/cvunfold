import type { Article } from "@/lib/content/articles";

export const SITE_NAME = "CVUnfold";
export const SITE_URL = "https://cvunfold.pl";
export const SITE_LOCALE = "pl_PL";
export const SITE_LANGUAGE = "pl-PL";
export const SITE_DESCRIPTION = "Analiza CV oczami rekrutera: sprawdź seniority, ownership, wpływ i wiarygodność techniczną na podstawie dowodów z dokumentu.";
export const SITE_LAST_SIGNIFICANT_UPDATE = "2026-08-09";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

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

export function articleImageUrl(article: Article): string {
  return absoluteUrl(`/pl/artykuly/${article.slug}/opengraph-image`);
}

export function buildArticleStructuredData(article: Article) {
  const articleUrl = absoluteUrl(`/pl/artykuly/${article.slug}`);
  const articlesUrl = absoluteUrl("/pl/artykuly");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: article.title,
        description: article.description,
        articleSection: article.category,
        image: [articleImageUrl(article)],
        datePublished: `${article.publishedAt}T09:00:00+02:00`,
        dateModified: `${article.publishedAt}T09:00:00+02:00`,
        inLanguage: SITE_LANGUAGE,
        isAccessibleForFree: true,
        wordCount: articleWordCount(article),
        mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
        author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL },
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
        primaryImageOfPage: { "@type": "ImageObject", url: articleImageUrl(article) },
        inLanguage: SITE_LANGUAGE,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: absoluteUrl("/pl") },
          { "@type": "ListItem", position: 2, name: "Artykuły", item: articlesUrl },
          { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
        ],
      },
    ],
  };
}
