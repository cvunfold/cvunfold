import { articles } from "@/lib/content/articles";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[character] || character);
}

export async function GET() {
  const feedUrl = absoluteUrl("/pl/artykuly/feed.xml");
  const articlesUrl = absoluteUrl("/pl/artykuly");
  const latestDate = articles.reduce((latest, article) => article.publishedAt > latest ? article.publishedAt : latest, "2026-01-01");
  const items = articles.map((article) => {
    const url = absoluteUrl(`/pl/artykuly/${article.slug}`);
    return `<item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.excerpt)}</description>
      <category>${escapeXml(article.category)}</category>
      <pubDate>${new Date(`${article.publishedAt}T09:00:00+02:00`).toUTCString()}</pubDate>
      <dc:creator>${SITE_NAME}</dc:creator>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SITE_NAME} — CV i kariera w branży tech</title>
    <link>${articlesUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>pl-PL</language>
    <lastBuildDate>${new Date(`${latestDate}T09:00:00+02:00`).toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
