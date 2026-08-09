import { chromium } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3109";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const client = await page.context().newCDPSession(page);
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: 1_600_000 / 8,
  uploadThroughput: 750_000 / 8,
  connectionType: "cellular4g",
});
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.addInitScript(() => {
  window.__launchMetrics = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    window.__launchMetrics.lcp = entries.at(-1)?.startTime || 0;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__launchMetrics.cls += entry.value;
  }).observe({ type: "layout-shift", buffered: true });
});
const started = Date.now();
const response = await page.goto(baseURL, { waitUntil: "networkidle" });
await page.waitForTimeout(1_000);
const metrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType("navigation")[0];
  const resources = performance.getEntriesByType("resource");
  return {
    lcpMs: Math.round(window.__launchMetrics.lcp),
    cls: Math.round(window.__launchMetrics.cls * 1_000) / 1_000,
    domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
    loadMs: Math.round(navigation.loadEventEnd),
    transferredKb: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
    resourceCount: resources.length,
  };
});
console.log(JSON.stringify({ status: response?.status(), wallMs: Date.now() - started, profile: "mobile 390px, 4x CPU, 150ms / 1.6Mbps", ...metrics }));
await browser.close();
if (response?.status() !== 200 || metrics.lcpMs > 2_500 || metrics.cls > 0.1) process.exitCode = 1;

