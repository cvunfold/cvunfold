import { expect, test } from "@playwright/test";

test("mobile sticky CTA appears only after the primary CTA leaves the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only behavior");
  await page.goto("/");
  const sticky = page.locator(".mobile-sticky-cta");
  await expect(sticky).toBeHidden();
  await page.locator(".level-demo").scrollIntoViewIfNeeded();
  await expect(sticky).toBeVisible();
  await expect(sticky).toHaveAttribute("data-visible", "true");
});
