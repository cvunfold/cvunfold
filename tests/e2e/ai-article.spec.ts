import { test, expect } from "@playwright/test";

test("AI career article stays low in the funnel and remains available", async ({ page }) => {
  await page.goto("/");
  const knowledge = page.locator(".launch-articles");
  await expect(knowledge).toBeVisible();
  await expect(knowledge.getByRole("heading", { name: "Dobre CV zaczyna się przed redakcją" })).toBeVisible();
  await knowledge.getByRole("link", { name: "Czytaj" }).last().click();
  await expect(page).toHaveURL(/\/artykuly\/jak-nie-dac-sie-zastapic-przez-ai$/);
  await expect(
    page.getByRole("heading", {
      name: "Czy AI zastąpi programistów? Jak zabezpieczyć swoją karierę",
      level: 1,
    }),
  ).toBeVisible();
});

test("English content is a complete navigable surface", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /Your CV has a few seconds/ })).toBeVisible();
  await expect(page.getByText("Full report from €9")).toBeVisible();
  await page.getByRole("link", { name: "All articles" }).click();
  await expect(page).toHaveURL(/\/en\/articles$/);
  await expect(page.getByRole("heading", { name: /Build value/ })).toBeVisible();
  await page.getByRole("link", { name: "Why does ownership matter to employers?", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Why does ownership matter to employers?", level: 1 })).toBeVisible();
});
