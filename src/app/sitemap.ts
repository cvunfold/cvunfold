import type { MetadataRoute } from "next";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { SITE_LAST_SIGNIFICANT_UPDATE, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = ["/", "/en", "/przykladowy-raport", "/en/sample-report", "/artykuly", "/en/articles", "/o-metodologii", "/en/methodology",
    "/regulamin", "/polityka-prywatnosci", "/cookies", "/usun-dane", "/kontakt",
    "/en/terms", "/en/privacy", "/en/cookies", "/en/delete-data", "/en/contact"];
  return [
    ...publicPages.map((path) => ({ url: absoluteUrl(path), lastModified: SITE_LAST_SIGNIFICANT_UPDATE })),
    ...articles.map((article) => ({ url: absoluteUrl(`/artykuly/${article.slug}`), lastModified: article.updatedAt ?? article.publishedAt })),
    ...articlesEn.map((article) => ({ url: absoluteUrl(`/en/articles/${article.slug}`), lastModified: article.updatedAt ?? article.publishedAt })),
  ];
}
