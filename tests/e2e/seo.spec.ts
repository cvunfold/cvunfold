import { expect, test } from "@playwright/test";

test("public pages expose consistent canonical and structured metadata", async ({ page, request }) => {
  await page.goto("/pl");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://cvunfold.pl/pl");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /https:\/\/cvunfold\.pl\/opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

  const landingJsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const landingTypes = landingJsonLd.flatMap((value) => JSON.parse(value)["@graph"]?.map((node: { "@type": string }) => node["@type"]) ?? []);
  expect(landingTypes).toEqual(expect.arrayContaining(["Organization", "WebSite", "WebPage", "Service"]));
  expect(landingTypes).not.toContain("FAQPage");

  const articleSlug = "jak-nie-dac-sie-zastapic-przez-ai";
  await page.goto(`/pl/artykuly/${articleSlug}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://cvunfold.pl/pl/artykuly/${articleSlug}`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator("time")).toHaveAttribute("datetime", "2026-08-09");

  const articleJsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const articleTypes = articleJsonLd.flatMap((value) => JSON.parse(value)["@graph"]?.map((node: { "@type": string }) => node["@type"]) ?? []);
  expect(articleTypes).toEqual(expect.arrayContaining(["BlogPosting", "WebPage", "BreadcrumbList"]));

  const ogResponse = await request.get(`/pl/artykuly/${articleSlug}/opengraph-image`);
  expect(ogResponse.ok()).toBe(true);
  expect(ogResponse.headers()["content-type"]).toContain("image/png");
});

test("discovery files are complete and private surfaces stay non-indexable", async ({ page, request }) => {
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robots = await robotsResponse.text();
  expect(robots).toContain("Disallow: /pl/analiza");
  expect(robots).toContain("Disallow: /pl/raport/");
  expect(robots).toContain("Sitemap: https://cvunfold.pl/sitemap.xml");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("https://cvunfold.pl/pl/artykuly/jak-nie-dac-sie-zastapic-przez-ai");
  expect(sitemap).toContain("<image:image>");
  expect(sitemap).not.toContain("/pl/analiza");

  const feedResponse = await request.get("/pl/artykuly/feed.xml");
  expect(feedResponse.ok()).toBe(true);
  expect(feedResponse.headers()["content-type"]).toContain("application/rss+xml");
  const feed = await feedResponse.text();
  expect(feed).toContain("<rss version=\"2.0\"");
  expect(feed).toContain("Jak nie dać się zastąpić przez AI?");

  const analysisResponse = await page.goto("/pl/analiza");
  expect(analysisResponse?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
