import { describe, expect, it } from "vitest";
import { articles, articlesBySlug } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";

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

  it("ships a complete English counterpart for every Polish article", () => {
    expect(articlesEn).toHaveLength(articles.length);
    expect(articlesEn.every((article) => article.sections.length >= 4 && article.checklist.length >= 4)).toBe(true);
  });

  it("publishes the developer CV length guide from the evidence hierarchy", () => {
    const article = articlesBySlug.get("ile-stron-powinno-miec-cv-programisty");
    expect(article?.title).toContain("Ile stron powinno mieć CV programisty?");
    expect(article?.sections.some(({ heading }) => heading.includes("Krótki konkret"))).toBe(true);
    expect(article?.checklist.length).toBeGreaterThanOrEqual(4);
  });
});
