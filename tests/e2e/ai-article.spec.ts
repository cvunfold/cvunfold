import { test, expect } from "@playwright/test";

test("AI career pillar leads to the complete article", async ({ page }) => {
  await page.goto("/pl");
  const section = page.getByRole("complementary", { name: "Jak nie dać się zastąpić przez AI?" });
  await expect(section).toBeVisible();
  await expect(section.getByText("Ownership problemu")).toBeVisible();
  await expect(section.getByText("AI pod kontrolą")).toBeVisible();

  await section.getByRole("link", { name: "Przeczytaj przewodnik" }).click();
  await expect(page).toHaveURL(/\/pl\/artykuly\/jak-nie-dac-sie-zastapic-przez-ai$/);
  await expect(page.getByRole("heading", { name: "Jak nie dać się zastąpić przez AI?", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pokaż w CV wartość odporną na automatyzację" })).toBeVisible();
  await expect(page.getByText("Czy potrafisz nazwać problemy, za które odpowiadasz")).toBeVisible();
});
