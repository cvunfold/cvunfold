import type { MetadataRoute } from "next";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { isPublishedArticle } from "@/lib/content/article-types";
import { absoluteUrl } from "@/lib/seo";
import { schoolSiteOrigin } from "@/lib/schools/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = ["/historia-poprawy-cv", "/en/cv-improvement-story", "/dla-szkol", "/en/for-schools", "/", "/en", "/przykladowy-raport", "/en/sample-report", "/artykuly", "/en/articles", "/o-metodologii", "/en/methodology",
    "/regulamin", "/polityka-prywatnosci", "/cookies", "/usun-dane", "/kontakt",
    "/en/terms", "/en/privacy", "/en/cookies", "/en/delete-data", "/en/contact"];
  return [
    ...publicPages.filter(path => !schoolSiteOrigin() || (path !== "/dla-szkol" && path !== "/en/for-schools")).map((path) => ({ url: absoluteUrl(path) })),
    ...articles.filter(isPublishedArticle).map((article) => ({ url: absoluteUrl(`/artykuly/${article.slug}`), lastModified: article.updatedAt ?? article.publishedAt })),
    ...articlesEn.filter(isPublishedArticle).map((article) => ({ url: absoluteUrl(`/en/articles/${article.slug}`), lastModified: article.updatedAt ?? article.publishedAt })),
  ];
}
