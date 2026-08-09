import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3108";
const output = process.env.QA_OUTPUT_DIR || "/private/tmp/cvunfold-qa";
await mkdir(output, { recursive: true });

const cases = [
  ["home", "/", 360, 844],
  ["home", "/", 390, 844],
  ["home", "/", 768, 900],
  ["home", "/", 1024, 900],
  ["home", "/", 1440, 900],
  ["home-en", "/en", 390, 844],
  ["home-en", "/en", 1440, 900],
  ["analysis", "/analiza", 390, 844],
  ["analysis", "/analiza", 768, 900],
  ["analysis", "/analiza", 1024, 900],
  ["analysis", "/analiza", 1440, 900],
  ["analysis-en", "/en/analysis", 390, 844],
  ["analysis-en", "/en/analysis", 1440, 900],
  ["sample", "/przykladowy-raport", 390, 844],
  ["sample", "/przykladowy-raport", 768, 900],
  ["sample", "/przykladowy-raport", 1024, 900],
  ["sample", "/przykladowy-raport", 1440, 900],
];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, path, width, height] of cases) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 240)); });
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText || "failed"}`));
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
  const layout = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector("h1")?.textContent?.trim() || "",
  }));
  const file = `${output}/${name}-${width}x${height}.png`;
  await page.screenshot({ path: file, fullPage: true });
  results.push({ path, viewport: `${width}x${height}`, status: response?.status(), overflow: layout.scrollWidth > layout.width, ...layout, consoleErrors, failedRequests, screenshot: file });
  await page.close();
}
await browser.close();
for (const result of results) console.log(JSON.stringify(result));
if (results.some((result) => result.status !== 200 || result.overflow || result.consoleErrors.length || result.failedRequests.length)) process.exitCode = 1;
