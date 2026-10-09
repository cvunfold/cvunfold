import { expect, test } from "@playwright/test";

for (const locale of ["pl", "en"] as const) {
  test(`career stage is required with a transparent editable prefill (${locale})`, async ({ page }) => {
    await page.goto(locale === "pl" ? "/analiza" : "/en/analysis");
    const stage = page.getByRole("combobox", { name: locale === "pl" ? /Etap kariery/ : /Career stage/ });
    const submit = page.getByRole("button", { name: locale === "pl" ? "Analizuj CV" : "Analyse my CV", exact: true });
    await expect(stage).toContainText(locale === "pl" ? "Wybierz etap kariery" : "Choose a career stage");
    await page.locator(".consent input").check();
    await expect(submit).toBeDisabled();
    await stage.click();
    await expect(page.getByRole("option")).toHaveCount(5);
    await expect(page.getByRole("option", { name: /Nie wiem|Not sure/ })).toHaveCount(0);
    await stage.press("Escape");
    await page.route("**/api/detect-role", route => route.fulfill({ json: { detected: true, role: "backend_developer", seniority: "junior" } }));
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic-cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 synthetic UI fixture") });
    await expect(stage).toContainText("Junior");
    await expect(page.getByText(locale === "pl" ? /Wykryliśmy etap na podstawie CV/ : /We detected a stage from your CV/)).toBeVisible();
    await expect(submit).toBeEnabled();
    await stage.click();
    await page.getByRole("option", { name: "Mid", exact: true }).click();
    await expect(stage).toContainText("Mid");
    await expect(page.getByText(locale === "pl" ? /Wykryliśmy etap na podstawie CV/ : /We detected a stage from your CV/)).toHaveCount(0);
    await page.locator('input[type="file"]').setInputFiles({ name: "second-synthetic-cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 second UI fixture") });
    await expect(stage).toContainText("Mid");
  });
}
