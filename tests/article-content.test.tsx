import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArticleSectionContent } from "@/components/article-section-content";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { articleGroups, relatedArticles } from "@/lib/content/article-navigation";
import { isArticleAvailable } from "@/lib/content/article-types";
import { articleMetadata } from "@/lib/content/article-metadata";
import { buildArticleStructuredData } from "@/lib/seo";
import { GET as plFeed } from "@/app/artykuly/feed.xml/route";
import { GET as enFeed } from "@/app/en/articles/feed.xml/route";

afterEach(() => vi.unstubAllEnvs());

describe("draft publication boundaries", () => {
  it("keeps the frontend draft out of production navigation and publication dates", () => {
    const draft = articles.find(article => article.publicationStatus === "draft")!;
    expect(draft.publishedAt).toBeUndefined();
    expect(articleMetadata(draft, "pl").robots).toMatchObject({ index: false, follow: false, googleBot: { index: false } });
    const post = buildArticleStructuredData(draft)["@graph"][0];
    expect(post).not.toHaveProperty("datePublished");
    expect(post).not.toHaveProperty("dateModified");
    vi.stubEnv("NODE_ENV", "production");
    expect(isArticleAvailable(draft)).toBe(false);
    expect(articleGroups(articles, "pl").flatMap(group => group.articles)).not.toContain(draft);
    const ats = articles.find(article => article.slug === "pierwsze-20-sekund-cv")!;
    expect(relatedArticles(articles, ats, "pl")).not.toContain(draft);
  });

  it("excludes both undated drafts from RSS feeds", async () => {
    const pl = await plFeed().text();
    const en = await enFeed().text();
    expect(pl).not.toContain("cv-frontend-developera-przyklad");
    expect(en).not.toContain("frontend-developer-cv-example");
    expect(pl + en).not.toContain("Invalid Date");
  });
});

describe("article reading paths", () => {
  it("covers every local article once and chooses relevant recommendations", () => {
    for (const [locale, items] of [["pl", articles], ["en", articlesEn]] as const) {
      const grouped = articleGroups(items, locale).flatMap(group => group.articles);
      expect(grouped).toHaveLength(items.length);
      expect(new Set(grouped.map(article => article.slug)).size).toBe(items.length);
    }
    const ats = articles.find(article => article.slug === "pierwsze-20-sekund-cv")!;
    const recommended = relatedArticles(articles, ats, "pl");
    expect(recommended[0].slug).toBe("cv-frontend-developera-przyklad");
    expect(recommended).not.toContain(ats);
  });

  it("renders semantic content and only supported link destinations", () => {
    const html = renderToStaticMarkup(<ArticleSectionContent locale="pl" section={{
      heading: "Sprawdź plik", paragraphs: [],
      blocks: [{ type: "heading", text: "Podsumowanie" }, { type: "list", ordered: true, items: ["Otwórz PDF", "Sprawdź tekst"] }],
      links: [{ label: "Poradnik", href: "/artykuly/pierwsze-20-sekund-cv" }, { label: "Źródło", href: "https://support.greenhouse.io/" }, { label: "Invalid", href: "javascript:alert(1)" }],
    }}/>);
    expect(html).toContain("<h3>Podsumowanie</h3>");
    expect(html).toContain('<ol class="article-content-list">');
    expect(html).toContain('href="/artykuly/pierwsze-20-sekund-cv"');
    expect(html).toContain('href="https://support.greenhouse.io/"');
    expect(html).not.toContain("javascript:");
  });
});
