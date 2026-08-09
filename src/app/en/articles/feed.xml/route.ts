import { articlesEn } from "@/lib/content/articles-en";
import { brand } from "@/lib/brand";
import { absoluteUrl } from "@/lib/seo";

const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function GET() {
  const items = articlesEn.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${absoluteUrl(`/en/articles/${article.slug}`)}</link><guid>${absoluteUrl(`/en/articles/${article.slug}`)}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${article.publishedAt}T09:00:00+02:00`).toUTCString()}</pubDate></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(brand.name)} — articles</title><link>${absoluteUrl("/en/articles")}</link><description>Seniority, ownership and impact in developer CVs.</description>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
