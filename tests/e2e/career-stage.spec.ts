import { expect, test } from "@playwright/test";

for (const locale of ["pl", "en"] as const) {
  test(`career examples use project language and retain Senior presentation (${locale})`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const path = locale === "pl" ? "/przykladowy-raport" : "/en/sample-report";
    await page.goto(`${path}?profile=bootcamp`);
    await expect(page).toHaveTitle(/raport|report/i);
    await expect(page.locator(".career-focus")).toContainText(locale === "pl" ? "Podstawy, projekty i własny wkład" : "Fundamentals, projects and personal contribution");
    await expect(page.locator(".seniority-track")).toHaveCount(0);
    await expect(page.locator(".report-title .career-score-note")).toContainText(locale === "pl" ? "Pierwsza praca w IT" : "First job in tech");
    await expect(page.locator("main")).toContainText(locale === "pl" ? "Twój wkład w projekty" : "Your project contribution");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/cvunfold-career-${locale}-${testInfo.project.name}.png`, fullPage: false });
    await expect(page.locator(".career-sample-nav")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await page.goto(`${path}?profile=mid`);
    await expect(page.locator("main")).toContainText(locale === "pl" ? "Samodzielność i zakres zadań" : "Independence and scope of work");
    await page.goto(`${path}?profile=senior`);
    await expect(page.locator(".seniority-track")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test(`bootcamp selection survives browser to API to private report (${locale})`, async ({ page }) => {
    const path = locale === "pl" ? "/analiza" : "/en/analysis";
    await page.goto(path);
    await page.getByRole("combobox", { name: locale === "pl" ? "Etap kariery (opcjonalne)" : "Career stage (optional)" }).click();
    await page.getByRole("option", { name: locale === "pl" ? /Pierwsza praca w IT/ : /First job in tech/ }).click();
    await expect(page.getByRole("combobox", { name: locale === "pl" ? /Etap kariery/ : /Career stage/ })).toContainText(locale === "pl" ? "Pierwsza praca w IT" : "First job in tech");
    await page.locator(".consent input").check();
    const response = page.waitForResponse(response => response.url().endsWith("/api/analyses") && response.request().method() === "POST");
    await page.getByRole("button", { name: locale === "pl" ? "Analizuj CV" : "Analyse my CV", exact: true }).click();
    const result = await response;
    expect(result.status()).toBe(200);
    const body = await result.json();
    expect(body.teaser).not.toHaveProperty("issues");
    await expect(page).toHaveURL(locale === "pl" ? /\/raport$/ : /\/en\/report$/);
    const unpaid = await (await page.request.get("/api/report")).json();
    expect(unpaid.report).not.toHaveProperty("categoryScores");
    await page.getByRole("button", { name: locale === "pl" ? /Odblokuj pełny raport/ : /Unlock the full report/ }).last().click();
    await expect(page.getByRole("heading", { name: locale === "pl" ? "Jak CV pokazuje przygotowanie do pierwszej roli" : "How the CV shows preparation for a first role" })).toBeVisible();
    const paid = await (await page.request.get("/api/report")).json();
    expect(paid.report.document).toMatchObject({ targetSeniority: "first_job", perceivedSeniority: "junior", careerContext: "first_job" });
    expect(paid.report.categoryScores.find((category: { key: string }) => category.key === "ownership").weight).toBe(0.09);
  });
}
