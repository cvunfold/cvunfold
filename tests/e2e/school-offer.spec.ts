import { expect, test } from "@playwright/test";

for (const path of ["/dla-szkol", "/en/for-schools"]) {
  test(`school offer is indexable and has its own share image: ${path}`, async ({ page, request }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBeUndefined();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow/);
    const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(imageUrl).toContain(`${path}/opengraph-image`);
    // Keep the check local even when metadataBase points at the canonical domain.
    const url = new URL(imageUrl!);
    const image = await request.get(url.pathname + url.search);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
    expect(image.headers()["x-robots-tag"]).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("school panel, callback and demo retain private response headers", async ({ request }) => {
  for (const path of ["/dla-szkol/panel", "/dla-szkol/potwierdz", "/dla-szkol/demo"]) {
    const response = await request.get(path);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});
