import type { MetadataRoute } from "next";
import { articles } from "@/lib/content/articles";
import { SITE_LAST_SIGNIFICANT_UPDATE, absoluteUrl, articleImageUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const latestArticleDate = articles.reduce(
    (latest, article) => article.publishedAt > latest ? article.publishedAt : latest,
    "2026-01-01",
  );
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/pl"),
      lastModified: SITE_LAST_SIGNIFICANT_UPDATE,
      images: [absoluteUrl("/opengraph-image")],
    },
    {
      url: absoluteUrl("/pl/przykladowy-raport"),
      lastModified: "2026-08-08",
      images: [absoluteUrl("/opengraph-image")],
    },
    {
      url: absoluteUrl("/pl/artykuly"),
      lastModified: latestArticleDate,
      images: [absoluteUrl("/opengraph-image")],
    },
  ];

  return [
    ...staticRoutes,
    ...articles.map((article) => ({
      url: absoluteUrl(`/pl/artykuly/${article.slug}`),
      lastModified: article.publishedAt,
      images: [articleImageUrl(article)],
    })),
  ];
}
