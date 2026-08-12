import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import {
  AUTHOR_ID,
  SITE_URL,
  absoluteUrl,
  buildArticleStructuredData,
  serializeJsonLd,
} from "@/lib/seo";

describe("public search surfaces", () => {
  it("publishes only canonical public URLs with real modification dates and images", () => {
    const entries = sitemap();
    const urls = entries.map(({ url }) => url);

    expect(urls).toContain(absoluteUrl("/"));
    expect(urls).toContain(absoluteUrl("/en"));
    expect(urls).toContain(absoluteUrl("/artykuly"));
    expect(urls).toContain(absoluteUrl("/en/articles"));
    expect(urls).toContain(absoluteUrl("/przykladowy-raport"));
    expect(urls).toContain(absoluteUrl("/en/sample-report"));
    expect(urls).toContain(absoluteUrl("/o-metodologii"));
    expect(urls).toContain(absoluteUrl("/en/methodology"));
    expect(urls).not.toContain(absoluteUrl("/analiza"));
    expect(urls).not.toContain(absoluteUrl("/en/analysis"));
    expect(urls.some((url) => url.includes("/raport"))).toBe(false);
    expect(entries).toHaveLength(18 + articles.length + articlesEn.length);

    for (const entry of entries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.lastModified).toBeTruthy();
      expect(entry.changeFrequency).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });

  it("keeps uploads, reports and APIs out of crawling", () => {
    const config = robots();
    expect(config.host).toBe(SITE_URL);
    expect(config.sitemap).toBe(absoluteUrl("/sitemap.xml"));
    expect(config.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/analiza", "/raport", "/en/analysis", "/en/report", "/pl/analiza", "/pl/raport/"],
    });
  });
});

describe("structured article data", () => {
  it("connects article, named author, page and breadcrumbs", () => {
    const article = articles[0];
    const data = buildArticleStructuredData(article);
    const graph = data["@graph"];
    const blogPost = graph.find((node) => node["@type"] === "BlogPosting");

    expect(graph.map((node) => node["@type"])).toEqual([
      "BlogPosting",
      "WebPage",
      "BreadcrumbList",
    ]);
    expect(blogPost).toMatchObject({
      headline: article.title,
      articleSection: article.category,
      datePublished: `${article.publishedAt}T09:00:00+02:00`,
      dateModified: `${article.updatedAt ?? article.publishedAt}T09:00:00+02:00`,
      author: {
        "@type": "Person",
        "@id": AUTHOR_ID,
        name: "Paweł Mączka-Czarnecki",
        url: absoluteUrl("/o-metodologii"),
      },
    });
    expect(blogPost?.wordCount).toBeGreaterThan(500);
    expect(blogPost && "image" in blogPost ? blogPost.image?.[0] : undefined)
      .toBe(absoluteUrl("/opengraph-image"));
  });

  it("publishes the latest real article update in the sitemap", () => {
    const article = articles[0];
    const entry = sitemap().find(({ url }) => url === absoluteUrl(`/artykuly/${article.slug}`));

    expect(article.updatedAt).toBe("2026-08-12");
    expect(entry?.lastModified).toBe(article.updatedAt);
  });

  it("escapes markup-like text before embedding JSON-LD in HTML", () => {
    const json = serializeJsonLd({ value: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c/script>");
  });
});
