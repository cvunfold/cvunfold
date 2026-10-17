import { describe, expect, it } from "vitest";
import { articles, articlesBySlug } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { articleAlternates, translatedArticlePath } from "@/lib/article-translations";

describe("knowledge articles", () => {
  it("publishes the AI career pillar as the leading article", () => {
    const article = articlesBySlug.get("jak-nie-dac-sie-zastapic-przez-ai");
    expect(articles[0]).toBe(article);
    expect(article?.title).toBe("Czy AI zastąpi programistów? Jak zabezpieczyć swoją karierę");
    expect(article?.sections.length).toBeGreaterThanOrEqual(10);
    expect(article?.sections.some((section) => section.heading.includes("Autodiagnoza"))).toBe(true);
    expect(article?.sections.some((section) => section.heading.includes("30 dni"))).toBe(true);
    expect(article?.checklist.length).toBeGreaterThanOrEqual(7);
  });

  it("keeps article slugs unique for static routes and the sitemap", () => {
    expect(new Set(articles.map(({ slug }) => slug)).size).toBe(articles.length);
  });

  it("keeps every declared English counterpart complete", () => {
    const translated = articles.filter(({ slug }) => articleAlternates(slug, "pl"));
    expect(articlesEn).toHaveLength(translated.length);
    for (const article of translated) {
      const path = translatedArticlePath(article.slug, "pl");
      expect(articlesEn.some(({ slug }) => path === `/en/articles/${slug}`)).toBe(true);
    }
    expect(articlesEn.every((article) => article.sections.length >= 4)).toBe(true);
    for (const article of translated) {
      const path = translatedArticlePath(article.slug, "pl");
      const counterpart = articlesEn.find(({ slug }) => path === `/en/articles/${slug}`)!;
      expect(counterpart.checklist).toHaveLength(article.checklist.length);
    }
  });

  it("connects both first-job guides and shares their illustration", () => {
    const article = articlesBySlug.get("cv-bez-doswiadczenia-w-it");
    expect(article?.title).toBe("CV bez doświadczenia w IT: jak zwiększyć swoje szanse");
    expect(article?.sections.filter(({ example }) => example)).toHaveLength(4);
    expect(article?.openingParagraphs?.join(" ")).toContain("Nie musisz przedstawiać się jako doświadczony developer");
    const counterpart = articlesEn.find(({ slug }) => slug === "tech-cv-with-no-experience")!;
    expect(counterpart.sections.filter(({ example }) => example)).toHaveLength(4);
    expect(counterpart.cover?.src).toBe(article?.cover?.src);
    expect(translatedArticlePath(article!.slug, "pl")).toBe("/en/articles/tech-cv-with-no-experience");
    expect(translatedArticlePath(counterpart.slug, "en")).toBe(`/artykuly/${article!.slug}`);
    expect(articleAlternates(counterpart.slug, "en")).toEqual(articleAlternates(article!.slug, "pl"));
  });

  it("publishes the developer CV length guide from the evidence hierarchy", () => {
    const article = articlesBySlug.get("ile-stron-powinno-miec-cv-programisty");
    expect(article?.title).toContain("Ile stron powinno mieć CV programisty?");
    expect(article?.sections.some(({ heading }) => heading.includes("Krótki konkret"))).toBe(true);
    expect(article?.checklist.length).toBeGreaterThanOrEqual(4);
  });
});
