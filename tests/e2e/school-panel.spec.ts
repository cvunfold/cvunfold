import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => {
    const host = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(host) ? route.continue() : route.fulfill({ status: 200, body: "" });
  });
});

test("school demo, report switching, synthetic batch and protected entry", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dla-szkol/demo");
  await expect(page).toHaveTitle(/Panel dla szkół IT/);
  await expect(page.getByRole("heading", { name: "Kursanci (10)" })).toBeVisible();
  await page.getByRole("button", { name: "Raport" }).first().click();
  await expect(page.getByRole("heading", { name: "Karolina Maj" })).toBeVisible();
  await page.getByRole("combobox", { name: "Kursant", exact: true }).click();
  await page.getByRole("option", { name: "Emilia Czech", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Emilia Czech" })).toBeVisible();
  // Opening this list after a deep scroll must stay above the sticky contents bar.
  await page.getByRole("link", { name: "Źródłowe CV", exact: true }).click();
  await page.getByRole("combobox", { name: "Kursant", exact: true }).click();
  await page.getByRole("option", { name: "Karolina Maj", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Karolina Maj", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wróć do grupy" }).click();
  await page.locator(".school-problem").first().click();
  await expect(page.getByRole("button", { name: "Pokaż wszystkich" })).toBeVisible();
  await page.getByRole("button", { name: "Pokaż wszystkich" }).click();
  await expect(page.getByRole("heading", { name: "Kursanci (10)" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/cvunfold-schools-${test.info().project.name}.png`, fullPage: true });
  await page.goto("/dla-szkol/panel");
  await expect(page.getByRole("heading", { name: "Panel Twojej szkoły" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kursanci (10)" })).toHaveCount(0);
  await expect(page.getByLabel("Adres e-mail opiekuna")).toBeVisible();
  const response = await page.request.get("/api/schools");
  expect(response.status()).toBe(401);
  expect(errors).toEqual([]);
});
