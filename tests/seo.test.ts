import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { brand } from "@/lib/brand";
import {
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
    expect(urls).not.toContain(absoluteUrl("/analiza"));
    expect(urls).not.toContain(absoluteUrl("/en/analysis"));
    expect(urls.some((url) => url.includes("/raport"))).toBe(false);
    expect(entries).toHaveLength(16 + articles.length + articlesEn.length);

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
  it("connects article, page and breadcrumbs without inventing an author", () => {
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
      author: { name: brand.name },
    });
    expect(blogPost?.wordCount).toBeGreaterThan(500);
    expect(blogPost && "image" in blogPost ? blogPost.image?.[0] : undefined)
      .toBe(absoluteUrl("/opengraph-image"));
  });

  it("escapes markup-like text before embedding JSON-LD in HTML", () => {
    const json = serializeJsonLd({ value: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c/script>");
  });
});
