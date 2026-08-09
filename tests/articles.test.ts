import { describe, expect, it } from "vitest";
import { articles, articlesBySlug } from "@/lib/content/articles";

describe("knowledge articles", () => {
  it("publishes the AI career pillar as the leading article", () => {
    const article = articlesBySlug.get("jak-nie-dac-sie-zastapic-przez-ai");
    expect(articles[0]).toBe(article);
    expect(article?.title).toBe("Jak nie dać się zastąpić przez AI?");
    expect(article?.sections.length).toBeGreaterThanOrEqual(6);
    expect(article?.checklist.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps article slugs unique for static routes and the sitemap", () => {
    expect(new Set(articles.map(({ slug }) => slug)).size).toBe(articles.length);
  });
});
