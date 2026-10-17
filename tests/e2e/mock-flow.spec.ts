import { test, expect } from "@playwright/test";

test("Other is clearly disclosed as an experimental role before upload", async ({ page }) => {
  await page.goto("/analiza");
  const role = page.getByRole("combobox", { name: "Rola docelowa" });
  await role.click();
  await page.getByRole("option", { name: /Pozostałe/ }).click();
  const note = page.getByRole("note");
  await expect(note).toContainText("zoptymalizowaliśmy i przetestowaliśmy dla wymienionych ról IT");
  await expect(note).toContainText("wynik może być mniej precyzyjny");
  await expect(note).toContainText("przed zakupem");
});

test("mock vertical slice keeps paid details server-side", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Zwykle brakuje kilku zdań/ })).toBeVisible();
  await page.getByRole("link", { name: "Sprawdź swoje CV za darmo", exact: true }).first().click();
  const role = page.getByRole("combobox", { name: "Rola docelowa" });
  await role.click();
  await page.getByRole("option", { name: /QA \/ Test Automation/ }).click();
  await page.getByRole("combobox", { name: /Etap kariery/ }).click();
  await page.getByRole("option", { name: "Senior", exact: true }).click();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: /Analizuj CV/ }).click();
  await expect(page).toHaveURL(/\/raport\/[a-f0-9-]{36}$/);
  await expect(page.getByRole("heading", { name: "Twój bezpłatny wynik" })).toBeVisible();
  await expect(page.locator(".teaser-finding")).toBeVisible();
  expect(await page.content()).not.toContain("Odpowiadałem za [zweryfikowany zakres]");
  // The teaser shows one finding; every other issue stays behind the paywall.
  expect(await page.content()).not.toContain("Zakres ownershipu jest niejasny");
  const analysisId = new URL(page.url()).pathname.split("/").at(-1);
  const response = await page.request.get(`/api/report?id=${analysisId}`);
  const teaser = await response.json();
  expect(teaser.report).not.toHaveProperty("issues");
  await page.getByRole("button", { name: /Odblokuj pełny raport/ }).last().click();
  await expect(page.getByText("Zakres ownershipu jest niejasny")).toBeVisible();
  await page.getByRole("button", { name: "Usuń raport", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Usunąć raport?" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Usuń raport", exact: true }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);
});

test("English mock flow returns an English teaser and full report", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Check your CV for free", exact: true }).first().click();
  await page.getByRole("combobox", { name: "Target role" }).click();
  await page.getByRole("option", { name: /Frontend Developer/ }).click();
  await page.getByRole("combobox", { name: /Career stage/ }).click();
  await page.getByRole("option", { name: "Senior", exact: true }).click();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "Analyse my CV" }).click();
  await expect(page).toHaveURL(/\/en\/report\/[a-f0-9-]{36}$/);
  await expect(page.getByRole("heading", { name: "Your free result" })).toBeVisible();
  const analysisId = new URL(page.url()).pathname.split("/").at(-1);
  const teaser = await (await page.request.get(`/api/report?id=${analysisId}`)).json();
  expect(teaser.report).not.toHaveProperty("issues");
  await page.getByRole("button", { name: /Unlock the full report/ }).last().click();
  await expect(page.getByRole("heading", { name: "Your CV report" })).toBeVisible();
  const full = await (await page.request.get(`/api/report?id=${analysisId}`)).json();
  expect(full.locale).toBe("en");
  expect(full.fullAccess).toBe(true);
  expect(full.report.document.detectedLanguage).toBe("en");
  expect(full.report.issues.length).toBeGreaterThan(0);
});
