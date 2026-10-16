import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const record = { exports: {} };
  cache.set(file, record.exports);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("module", "exports", "require", js)(record, record.exports, specifier => load(path.resolve(path.dirname(file), `${specifier}.ts`)));
  return record.exports;
}

const { articles } = load("src/lib/content/articles.ts");
const { articlesEn } = load("src/lib/content/articles-en.ts");
const publicPaths = ["/", "/en", "/artykuly", "/en/articles", "/przykladowy-raport", "/en/sample-report", "/o-metodologii", "/en/methodology", "/historia-poprawy-cv", "/en/cv-improvement-story", "/dla-szkol", "/en/for-schools", "/regulamin", "/polityka-prywatnosci", "/cookies", "/usun-dane", "/kontakt", "/en/terms", "/en/privacy", "/en/cookies", "/en/delete-data", "/en/contact"];
const inventory = [
  ...articles.map(article => ({ locale: "pl", path: `/artykuly/${article.slug}`, ...article })),
  ...articlesEn.map(article => ({ locale: "en", path: `/en/articles/${article.slug}`, ...article })),
];
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3112");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) throw new Error("This audit only requests the local preview.");
const output = process.argv[3] ?? "/tmp/cvunfold-public-content-audit.json";
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1].toLowerCase(), match[2]]));
const paths = [...publicPaths, ...inventory.map(article => article.path)];
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < paths.length) {
    const pathname = paths[cursor++];
    try {
      const response = await fetch(new URL(pathname, base), { redirect: "manual", signal: AbortSignal.timeout(45000) });
      const html = await response.text();
      const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0]));
      const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0]));
      results.push({ path: pathname, status: response.status, title: [...html.matchAll(/<title>([^<]*)<\/title>/g)].at(-1)?.[1], h1Count: [...html.matchAll(/<h1\b/g)].length, description: meta.find(tag => tag.name === "description")?.content, canonical: links.find(tag => tag.rel === "canonical")?.href, alternates: links.filter(tag => tag.hreflang).map(tag => ({ language: tag.hreflang, href: tag.href })), robots: meta.find(tag => tag.name === "robots")?.content, twitterTitle: meta.find(tag => tag.name === "twitter:title")?.content, ogUrl: meta.find(tag => tag.property === "og:url")?.content });
    } catch (error) { results.push({ path: pathname, error: error.message }); }
  }
}));
const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
const feeds = await Promise.all(["/artykuly/feed.xml", "/en/articles/feed.xml"].map(async pathname => ({ path: pathname, xml: await (await fetch(new URL(pathname, base))).text() })));
const issues = results.flatMap(result => {
  const issues = [];
  const draft = inventory.find(article => article.path === result.path && article.publicationStatus === "draft");
  if (draft && result.status === 404) return []; // Production deliberately hides drafts.
  if (result.status !== 200) issues.push("status");
  if (result.h1Count !== 1) issues.push("h1");
  if (!result.title || !result.description || !result.canonical) issues.push("metadata");
  if (result.canonical && !result.canonical.startsWith("https://cvunfold.com")) issues.push("canonical-base");
  if (result.alternates?.length < 2) issues.push("alternates");
  if (result.ogUrl && new URL(result.ogUrl).pathname !== result.path) issues.push("og-url");
  return issues.map(issue => ({ path: result.path, issue }));
});
const drafts = inventory.filter(article => article.publicationStatus === "draft");
for (const draft of drafts) {
  if (sitemap.includes(draft.path) || feeds.some(feed => feed.xml.includes(draft.path))) issues.push({ path: draft.path, issue: "draft-discovery" });
  if (!results.find(result => result.path === draft.path)?.robots?.includes("noindex")) issues.push({ path: draft.path, issue: "draft-robots" });
}
fs.writeFileSync(output, JSON.stringify({ base: base.href, inventory, results: results.sort((a, b) => a.path.localeCompare(b.path)), sitemapUrlCount: [...sitemap.matchAll(/<loc>/g)].length, issues }, null, 2));
console.log(JSON.stringify({ pages: results.length, sitemapUrls: [...sitemap.matchAll(/<loc>/g)].length, drafts: drafts.length, issues, output }, null, 2));
process.exitCode = issues.length ? 1 : 0;
