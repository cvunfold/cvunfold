import { expect, test } from "@playwright/test";

test("public sample report uses realistic fictional evidence", async ({ page }) => {
  await page.goto("/pl");

  await page.getByRole("link", { name: "Zobacz przykładowy raport" }).first().click();
  await expect(page).toHaveURL(/\/pl\/przykladowy-raport$/);

  await expect(
    page.getByRole("heading", { name: "Przykładowy raport CV" }),
  ).toBeVisible();
  await expect(page.getByText("Marta Nowak").first()).toBeVisible();
  await expect(page.getByText(/p75 LCP spadło z 3,1 s do 2,2 s/).first()).toBeVisible();
  await expect(page.getByText(/wszystkie wyniki biznesowe są fikcyjne/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Sprawdź swoje CV" }).first()).toHaveAttribute(
    "href",
    "/pl/analiza",
  );
});
