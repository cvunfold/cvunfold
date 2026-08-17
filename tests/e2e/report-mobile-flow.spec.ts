import { expect, test, type Page } from "@playwright/test";

async function createPolishTeaser(page: Page) {
  await page.goto("/analiza");
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "Analizuj CV" }).click();
  await expect(page).toHaveURL(/\/raport$/);
  await expect(page.getByRole("heading", { name: "Twój bezpłatny wynik" })).toBeVisible();
}

test("analysis progress stays in the viewport while the request is pending", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile interaction proof");
  let releaseResponse: () => void = () => {};
  const heldResponse = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/api/analyses", async (route) => {
    const response = await route.fetch();
    await heldResponse;
    await route.fulfill({ response });
  });

  await page.goto("/analiza");
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "Analizuj CV" }).click();

  const overlay = page.getByRole("dialog", { name: "Analizujemy Twoje CV" });
  await expect(overlay).toBeVisible();
  await expect(overlay.getByText("Czytam strukturę CV")).toBeVisible();
  const geometry = await overlay.evaluate((element) => ({
    position: getComputedStyle(element).position,
    top: element.getBoundingClientRect().top,
    width: element.getBoundingClientRect().width,
    viewport: window.innerWidth,
    bodyOverflow: document.body.style.overflow,
  }));
  expect(geometry).toEqual(expect.objectContaining({ position: "fixed", top: 0, bodyOverflow: "hidden" }));
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);

  releaseResponse();
  await expect(page).toHaveURL(/\/raport$/);
});

for (const viewport of [
  { width: 320, height: 700, label: "narrow mobile" },
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
]) {
  test(`free report keeps its first purchase action visible without overflow on ${viewport.label}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Explicit viewport matrix runs once");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await createPolishTeaser(page);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    const primaryAction = viewport.width <= 1050
      ? page.locator(".report-mobile-offer .button")
      : page.locator(".report-sidebar .sidebar-buy");
    await expect(primaryAction).toBeVisible();
    const actionBox = await primaryAction.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport.height);

    const findingBeforeScores = await page.evaluate(() => {
      const finding = document.querySelector(".teaser-finding");
      const scores = document.querySelector(".score-rows")?.closest("section");
      return Boolean(finding && scores && (finding.compareDocumentPosition(scores) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    expect(findingBeforeScores).toBe(true);
  });
}

test("mobile sticky purchase action is limited to the useful middle of the teaser", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Explicit mobile viewport");
  await page.setViewportSize({ width: 390, height: 844 });
  await createPolishTeaser(page);
  const sticky = page.locator(".report-mobile-sticky-cta");

  await expect(sticky).toBeHidden();
  await page.locator(".teaser-finding").scrollIntoViewIfNeeded();
  await expect(sticky).toBeVisible();
  await expect(sticky).toHaveAttribute("data-visible", "true");

  const expectNoOverlap = async (privacySelector: string) => {
    const privacy = page.locator(privacySelector);
    if (!await privacy.isVisible()) return;
    const [stickyBox, privacyBox] = await Promise.all([sticky.boundingBox(), privacy.boundingBox()]);
    expect(stickyBox).not.toBeNull();
    expect(privacyBox).not.toBeNull();
    const overlaps = stickyBox!.x < privacyBox!.x + privacyBox!.width
      && stickyBox!.x + stickyBox!.width > privacyBox!.x
      && stickyBox!.y < privacyBox!.y + privacyBox!.height
      && stickyBox!.y + stickyBox!.height > privacyBox!.y;
    expect(overlaps).toBe(false);
  };
  await expectNoOverlap(".consent-banner");
  const necessaryOnly = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await necessaryOnly.isVisible()) await necessaryOnly.click();
  await expectNoOverlap(".privacy-settings");

  await page.locator(".locked").scrollIntoViewIfNeeded();
  await expect(sticky).toBeHidden();
  await expect(sticky).toHaveAttribute("data-visible", "false");
});
