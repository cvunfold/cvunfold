import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3109";
const output = process.env.QA_OUTPUT_DIR || "/private/tmp/cvunfold-lighthouse";
const paths = ["/", "/en"];
const thresholds = { performance: .85, accessibility: .95, "best-practices": .95, seo: .95 };
await mkdir(output, { recursive: true });

const chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"] });
const summaries = [];
try {
  for (const path of paths) {
    const result = await lighthouse(`${baseURL}${path}`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: Object.keys(thresholds),
    });
    if (!result) throw new Error(`LIGHTHOUSE_NO_RESULT:${path}`);
    const slug = path === "/" ? "home-pl" : "home-en";
    await writeFile(`${output}/${slug}.json`, result.report, "utf8");
    const scores = Object.fromEntries(Object.entries(thresholds).map(([category]) => [category, result.lhr.categories[category]?.score ?? 0]));
    const summary = { path, scores, report: `${output}/${slug}.json` };
    summaries.push(summary);
    console.log(JSON.stringify(summary));
  }
} finally {
  await chrome.kill();
}

const failures = summaries.flatMap((summary) => Object.entries(thresholds)
  .filter(([category, threshold]) => summary.scores[category] < threshold)
  .map(([category, threshold]) => `${summary.path} ${category}: ${summary.scores[category]} < ${threshold}`));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
