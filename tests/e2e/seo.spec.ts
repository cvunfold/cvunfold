import { expect, test } from "@playwright/test";

test("public pages expose canonical bilingual metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Analiza CV developera: seniority i pierwsze wrażenie | CV Unfold");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/cvunfold\.pl\/?$/);
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://cvunfold.pl/en");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "CV Unfold");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image/);
  const website = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .flatMap((value) => JSON.parse(value)["@graph"] ?? [])
    .find((node: { "@type"?: string }) => node["@type"] === "WebSite");
  expect(website).toMatchObject({ name: "CV Unfold", alternateName: ["CVUnfold", "cvunfold.pl"] });

  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page).toHaveTitle("Developer CV review: seniority and first impression | CV Unfold");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://cvunfold.pl/en");
  await expect(page.locator("h1")).toContainText("Does your CV show");
  await page.goto("/artykuly/jak-nie-dac-sie-zastapic-przez-ai");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).flatMap((value) => JSON.parse(value)["@graph"]?.map((node: { "@type": string }) => node["@type"]) ?? []);
  expect(types).toEqual(expect.arrayContaining(["BlogPosting", "WebPage", "BreadcrumbList"]));
});

test("discovery files exclude private surfaces", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /analiza");
  expect(robots).toContain("Disallow: /en/report");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://cvunfold.pl/artykuly/jak-nie-dac-sie-zastapic-przez-ai");
  expect(sitemap).toContain("https://cvunfold.pl/en/articles/how-to-stay-relevant-in-the-age-of-ai");
  expect(sitemap).not.toContain("/analiza");
  const feed = await request.get("/artykuly/feed.xml");
  expect(feed.ok()).toBe(true);
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const analysisResponse = await page.goto("/analiza");
  expect(analysisResponse?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
