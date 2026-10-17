import type { Metadata } from "next";
import type { Article } from "./article-types";
import type { Locale } from "@/lib/i18n";
import { articleAlternates } from "@/lib/article-translations";
import { articleImageUrl } from "@/lib/seo";
import { brand } from "@/lib/brand";

export function articleMetadata(article: Article, locale: Locale): Metadata {
  const url = `${locale === "pl" ? "/artykuly" : "/en/articles"}/${article.slug}`;
  const image = { url: articleImageUrl(article, locale), width: article.cover?.width ?? 1200, height: article.cover?.height ?? 630, alt: article.cover?.alt ?? article.title };
  return {
    title: article.title,
    description: article.description,
    authors: [{ name: "Paweł Mączka-Czarnecki", url: locale === "pl" ? "/o-metodologii" : "/en/methodology" }],
    creator: "Paweł Mączka-Czarnecki",
    publisher: brand.name,
    ...(article.publicationStatus === "draft" ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } } : {}),
    alternates: { canonical: url, languages: articleAlternates(article.slug, locale) },
    openGraph: { type: "article", title: article.title, description: article.description, url, locale: locale === "pl" ? "pl_PL" : "en_US", images: [image], authors: ["Paweł Mączka-Czarnecki"] },
    twitter: { card: "summary_large_image", title: article.title, description: article.description, images: [image] },
  };
}
