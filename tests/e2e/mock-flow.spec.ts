import { test, expect } from "@playwright/test";

test("mock vertical slice keeps paid details server-side", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Masz doświadczenie/ })).toBeVisible();
  await page.getByRole("link", { name: /Zobacz, na jaki poziom/ }).first().click();
  const role = page.getByRole("combobox", { name: "Rola docelowa" });
  await role.click();
  await page.getByRole("option", { name: /QA \/ Test Automation/ }).click();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: /Analizuj CV/ }).click();
  await expect(page).toHaveURL(/\/raport$/);
  await expect(page.getByRole("heading", { name: "Najważniejsze ustalenie darmowej analizy" })).toBeVisible();
  expect(await page.content()).not.toContain("Odpowiadałem za [zweryfikowany zakres]");
  const response = await page.request.get("/api/report");
  const teaser = await response.json();
  expect(teaser.report).not.toHaveProperty("issues");
  await page.getByRole("button", { name: /Odblokuj pełny raport/ }).last().click();
  await expect(page.getByText("Efekty pracy giną pod listą obowiązków")).toBeVisible();
  await page.getByRole("button", { name: "Wyślij feedback" }).click();
  await expect(page.getByText(/Dziękujemy/)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Usuń raport" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);
});

test("English mock flow returns an English teaser and full report", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: /See what level my CV communicates/ }).first().click();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "Analyse my CV" }).click();
  await expect(page).toHaveURL(/\/en\/report$/);
  await expect(page.getByRole("heading", { name: "The most important finding from your free analysis" })).toBeVisible();
  expect(await page.content()).not.toContain("A generic bullet weakens an otherwise strong section");
  await page.getByRole("button", { name: /Unlock the full report/ }).last().click();
  await expect(page.getByRole("heading", { name: "Your CV report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A generic bullet weakens an otherwise strong section" })).toBeVisible();
});
