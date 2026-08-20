import { expect, test } from "@playwright/test";

test("Polish and English landing pages explain the diagnostic method", async ({ page }) => {
  await page.goto("/");
  const agent = page.locator(".ai-agent-section");
  await expect(page.getByRole("link", { name: "Sprawdź, co pokazuje moje CV" }).first()).toBeVisible();
  await expect(page.getByText(/Oceniamy dokument, nie Ciebie/)).toBeVisible();
  await expect(page.getByText("Ogólna jakość komunikacji CV")).toBeVisible();
  await expect(agent.getByRole("heading", { name: "Masz już własnego agenta AI? Świetnie." })).toBeVisible();
  await expect(agent.getByRole("heading", { name: "Użyj go do redakcji. CV Unfold służy do diagnozy." })).toBeVisible();
  await expect(agent.locator("article")).toHaveCount(4);
  await expect(agent.locator("dt")).toHaveText(["REWRITE", "EXPOSE", "GAP", "QUESTION"]);
  await expect(agent.getByRole("link", { name: "Zobacz pełną metodologię" })).toHaveAttribute("href", "/o-metodologii");
  expect(await page.evaluate(([atsSelector, agentSelector, promiseSelector]) => {
    const atsNode = document.querySelector(atsSelector);
    const agentNode = document.querySelector(agentSelector);
    const promiseNode = document.querySelector(promiseSelector);
    return Boolean(atsNode && agentNode && promiseNode
      && atsNode.compareDocumentPosition(agentNode) & Node.DOCUMENT_POSITION_FOLLOWING
      && agentNode.compareDocumentPosition(promiseNode) & Node.DOCUMENT_POSITION_FOLLOWING);
  }, [".ats-section", ".ai-agent-section", ".promise-strip"])).toBe(true);
  await expect(page.locator(".seconds-cards article > b")).toHaveText(["05", "10", "20"]);
  await expect(page.getByText("Najpierw zobaczysz bezpłatny wynik wstępny.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zacznij od darmowego wyniku" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rozpocznij analizę pod ofertę" })).toBeVisible();

  await page.goto("/en");
  const agentEn = page.locator(".ai-agent-section");
  await expect(page.getByText(/We assess the document, not you/)).toBeVisible();
  await expect(page.getByText("Overall CV communication quality")).toBeVisible();
  await expect(agentEn.getByRole("heading", { name: "Already have your own AI agent? Great." })).toBeVisible();
  await expect(agentEn.locator("dt")).toHaveText(["REWRITE", "EXPOSE", "GAP", "QUESTION"]);
  await expect(agentEn.getByRole("link", { name: "See the full methodology" })).toHaveAttribute("href", "/en/methodology");
  await expect(page.getByRole("link", { name: "Start with the free result" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a job-specific review" })).toBeVisible();
});

test("mobile upload keeps only closed settings in the Web Share handoff", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile handoff behavior");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload: ShareData) => { (window as typeof window & { __sharePayload?: ShareData }).__sharePayload = payload; },
    });
  });
  await page.goto("/analiza?role=qa_test_automation&seniority=senior&handoff=mobile&handoff_origin=google_cpc&utm_campaign=private-detail&gclid=secret-click-id");
  await page.locator('input[type="file"]').setInputFiles([]);
  await expect(page.getByText("Wybierz CV z telefonu lub dostępnej chmury")).toBeVisible();
  await expect(page.getByText("PDF/DOCX · Dysk Google, iCloud lub Pliki · maks. 8 MB")).toBeVisible();
  await expect(page.getByText("Bezpieczne ustawienia zostały przeniesione.", { exact: false })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Rola docelowa" })).toContainText("QA / Test Automation");
  await expect(page.getByRole("combobox", { name: /Poziom stanowiska/ })).toContainText("Senior");
  await page.getByRole("button", { name: "Nie masz CV na telefonie? Udostępnij link na komputer" }).click();
  await expect(page.getByText("Link został udostępniony.", { exact: false })).toBeVisible();
  const shared = await page.evaluate(() => (window as typeof window & { __sharePayload?: ShareData }).__sharePayload?.url);
  const url = new URL(String(shared));
  expect(Object.fromEntries(url.searchParams)).toEqual({
    plan: "full_review",
    role: "qa_test_automation",
    seniority: "senior",
    handoff: "mobile",
  });
  expect(url.searchParams.has("gclid")).toBe(false);
  expect(url.searchParams.has("utm_campaign")).toBe(false);
});

test("desktop handoff link pre-fills safe settings and asks for a local file", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop handoff destination");
  await page.goto("/analiza?role=mobile_developer&seniority=lead&handoff=mobile");
  await expect(page.getByText("Bezpieczne ustawienia zostały przeniesione.", { exact: false })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Rola docelowa" })).toContainText("Mobile Developer");
  await expect(page.getByRole("combobox", { name: /Poziom stanowiska/ })).toContainText("Lead");
  await expect(page.locator('input[type="file"]')).toBeAttached();
});

test("mobile handoff falls back to the clipboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile handoff behavior");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => { (window as typeof window & { __copiedText?: string }).__copiedText = value; } },
    });
  });
  await page.goto("/en/analysis?role=backend_developer&seniority=mid");
  await page.getByRole("button", { name: "Do not have your CV on your phone? Share a link to your computer" }).click();
  await expect(page.getByText("Link copied.", { exact: false })).toBeVisible();
  const copied = await page.evaluate(() => (window as typeof window & { __copiedText?: string }).__copiedText);
  const url = new URL(String(copied));
  expect(Object.fromEntries(url.searchParams)).toEqual({
    plan: "full_review",
    role: "backend_developer",
    seniority: "mid",
    handoff: "mobile",
  });
});

test("native upload selection remains available and files are selected locally", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile upload behavior");
  await page.goto("/analiza");
  const input = page.locator('input[type="file"]');
  await input.dispatchEvent("cancel");
  await input.setInputFiles({ name: "synthetic-cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 synthetic") });
  await expect(page.getByText("synthetic-cv.pdf")).toBeVisible();
});
