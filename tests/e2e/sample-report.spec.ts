import { expect, test } from "@playwright/test";

test("public sample report uses realistic fictional evidence", async ({ page }) => {
  await page.goto("/pl");

  await expect(page.locator(".landing-page > .site-header")).toHaveCSS("position", "sticky");
  await expect(page.getByRole("link", { name: "Sprawdź CV", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dlaczego ownership jest ważny", exact: true })).toHaveAttribute(
    "href",
    "/pl/artykuly/dlaczego-ownership-jest-wazny-dla-pracodawcow",
  );

  await page.getByRole("link", { name: "Zobacz przykładowy raport" }).first().click();
  await expect(page).toHaveURL(/\/pl\/przykladowy-raport$/);

  await expect(
    page.getByRole("heading", { name: "Przykładowy raport CV" }),
  ).toBeVisible();
  await expect(page.getByText("Marta Nowak").first()).toBeVisible();
  await expect(page.getByText(/p75 LCP spadło z 3,1 s do 2,2 s/).first()).toBeVisible();
  await expect(page.getByText(/wszystkie wyniki biznesowe są fikcyjne/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jak widzi Cię rekruter" })).toBeVisible();
  await expect(page.getByText(/Senior Frontend Developerka o mocnej specjalizacji/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "O co mogą zapytać" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Jak pokazać seniority/ })).toHaveAttribute(
    "href",
    "/pl/artykuly/jak-pokazac-seniority-w-cv",
  );
  await expect(page.getByRole("link", { name: /Ownership/ })).toHaveAttribute(
    "href",
    "/pl/artykuly/dlaczego-ownership-jest-wazny-dla-pracodawcow",
  );
  await expect(page.getByRole("button", { name: "Pobierz raport jako PDF" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sprawdź swoje CV" }).first()).toHaveAttribute(
    "href",
    "/pl/analiza",
  );

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".report-sidebar")).toBeHidden();
  await expect(page.locator(".report-mobile-header")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pobierz raport jako PDF" })).toBeHidden();
});
