import { expect, test } from "@playwright/test";

test("public sample report uses clearly fictional evidence", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".landing-page > .site-header")).toHaveCSS("position", "sticky");
  await page.getByRole("link", { name: "Zobacz przykładowy raport" }).click();
  await expect(page).toHaveURL(/\/przykladowy-raport$/);
  await expect(page.getByRole("heading", { name: "Przykładowy raport CV" })).toBeVisible();
  await expect(page.getByText("Dane syntetyczne · fikcyjna kandydatka").last()).toBeVisible();
  await expect(page.getByText(/Zaprojektowałam i wdrożyłam design system obejmujący 32 komponenty/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jak dokument buduje Twój profil" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drukuj / zapisz PDF" })).toBeVisible();
  await page.getByRole("link", { name: "Wróć do strony głównej" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/przykladowy-raport");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".report-sidebar")).toBeHidden();
  await expect(page.getByRole("button", { name: "Drukuj / zapisz PDF" })).toBeHidden();
});
