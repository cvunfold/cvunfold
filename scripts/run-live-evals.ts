import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSegments } from "../src/lib/document-parsing";
import { reviewWithOpenAI } from "../src/lib/ai/openai-review";
import {
  estimateWorstCaseCostPln,
  evaluateLiveReport,
  manualReviewQuestions,
  type LiveEvalCase,
  type LiveEvalLocale,
} from "../src/lib/ai/live-eval";
import { EN_SYSTEM_PROMPT } from "../src/lib/ai/prompts/review-en-v1";
import { SYSTEM_PROMPT } from "../src/lib/ai/prompts/review-pl-v3";

type Result = {
  id: string;
  locale: LiveEvalLocale;
  status: "passed_automatic" | "failed_automatic" | "rejected_before_model" | "not_run";
  checks: Array<{ name: string; pass: boolean; detail?: string }>;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostPln?: number;
  reportFile?: string;
  errorCategory?: string;
};

const execute = process.argv.includes("--execute");
const casePath = join(process.cwd(), "fixtures", "live-eval-cases.json");
const allCases = JSON.parse(readFileSync(casePath, "utf8")) as LiveEvalCase[];
const requestedCaseIds = new Set((process.env.OPENAI_EVAL_CASE_IDS || "").split(",").map((value) => value.trim()).filter(Boolean));
const cases = requestedCaseIds.size ? allCases.filter((item) => requestedCaseIds.has(item.id)) : allCases;
const locales: LiveEvalLocale[] = ["pl", "en"];
const maxCostPln = Number(process.env.OPENAI_EVAL_MAX_COST_PLN || 50);
const plnPerUsd = Number(process.env.OPENAI_EVAL_PLN_PER_USD || 5);
const costSafetyFactor = Number(process.env.OPENAI_EVAL_COST_SAFETY_FACTOR || 2.5);
const alreadySpentPln = Number(process.env.OPENAI_EVAL_ALREADY_SPENT_PLN || 0);
const maxOutputTokens = Number(process.env.OPENAI_EVAL_MAX_OUTPUT_TOKENS || 6_000);
const inputRate = Number(process.env.OPENAI_INPUT_COST_PER_MILLION);
const outputRate = Number(process.env.OPENAI_OUTPUT_COST_PER_MILLION);

if (!Number.isFinite(maxCostPln) || maxCostPln <= 0 || maxCostPln > 50) throw new Error("OPENAI_EVAL_MAX_COST_PLN must be between 0 and 50.");
if (!Number.isFinite(plnPerUsd) || plnPerUsd < 3 || plnPerUsd > 8) throw new Error("OPENAI_EVAL_PLN_PER_USD must be between 3 and 8.");
if (!Number.isFinite(costSafetyFactor) || costSafetyFactor < 1 || costSafetyFactor > 4) throw new Error("OPENAI_EVAL_COST_SAFETY_FACTOR must be between 1 and 4.");
if (!Number.isFinite(alreadySpentPln) || alreadySpentPln < 0 || alreadySpentPln > maxCostPln) throw new Error("OPENAI_EVAL_ALREADY_SPENT_PLN must fit inside the hard cap.");
if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 2_000 || maxOutputTokens > 8_000) throw new Error("OPENAI_EVAL_MAX_OUTPUT_TOKENS must be between 2000 and 8000.");
if (requestedCaseIds.size && cases.length !== requestedCaseIds.size) throw new Error("OPENAI_EVAL_CASE_IDS contains an unknown case ID.");

const runnable = cases.flatMap((item) => locales.map((locale) => ({ item, locale }))).filter(({ item }) => !item.rejectBeforeModel);
const ratesConfigured = Number.isFinite(inputRate) && inputRate >= 0 && Number.isFinite(outputRate) && outputRate >= 0;
const rawWorstCaseCostPln = ratesConfigured ? estimateWorstCaseCostPln({
  cases: runnable.map(({ item, locale }) => ({ cv: item.cv[locale], jobDescription: item.jobDescription?.[locale] })),
  systemPromptCharacters: Math.max(SYSTEM_PROMPT.length, EN_SYSTEM_PROMPT.length),
  inputUsdPerMillion: inputRate,
  outputUsdPerMillion: outputRate,
  maxOutputTokens,
  plnPerUsd,
}) : null;
const worstCaseCostPln = rawWorstCaseCostPln == null ? null : alreadySpentPln + rawWorstCaseCostPln * costSafetyFactor;

async function main(): Promise<void> {
  console.log(`CV Unfold live eval preflight: ${cases.length} cases × ${locales.length} locales, ${runnable.length} paid model calls.`);
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}. Hard cap: ${maxCostPln.toFixed(2)} PLN.`);
  console.log(`Cost safety factor: ${costSafetyFactor.toFixed(2)}×. Already spent: ${alreadySpentPln.toFixed(2)} PLN.`);
  console.log(worstCaseCostPln == null ? "Worst-case cost unavailable: configure model rates before execution." : `Worst-case cost estimate: ${worstCaseCostPln.toFixed(2)} PLN.`);

  if (!execute) {
    console.log("Dry run complete. Use `pnpm eval:live -- --execute` only after confirming the CV Unfold OpenAI project and budget.");
    return;
  }
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_REVIEW_MODEL) throw new Error("CV Unfold OPENAI_API_KEY and OPENAI_REVIEW_MODEL are required.");
  if (!ratesConfigured || worstCaseCostPln == null) throw new Error("OPENAI model input/output rates are required before paid eval execution.");
  if (worstCaseCostPln > maxCostPln) throw new Error(`Worst-case estimate ${worstCaseCostPln.toFixed(2)} PLN exceeds the ${maxCostPln.toFixed(2)} PLN cap.`);

  const outputDir = mkdtempSync(join(tmpdir(), "cvunfold-live-eval-"));
  const results: Result[] = [];
  let actualCostPln = alreadySpentPln;

  caseLoop: for (const item of cases) {
    for (const locale of locales) {
      if (item.rejectBeforeModel) {
        const rejected = item.cv[locale].trim().length < 120;
        results.push({
          id: item.id,
          locale,
          status: rejected ? "rejected_before_model" : "failed_automatic",
          checks: [{ name: "unreadable input rejected before model usage", pass: rejected }],
        });
        continue;
      }
      const segments = createSegments(item.cv[locale]);
      try {
        const { report, telemetry } = await reviewWithOpenAI({
          segments,
          targetRole: "frontend_developer",
          targetSeniority: item.targetSeniority,
          jobDescription: item.jobDescription?.[locale],
          locale,
          maxOutputTokens,
        });
        const checks = evaluateLiveReport(report, segments, locale, item);
        const costPln = (telemetry.estimatedCost || 0) * plnPerUsd * costSafetyFactor;
        actualCostPln += costPln;
        const reportFile = join(outputDir, `${item.id}-${locale}.json`);
        writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
        results.push({
          id: item.id,
          locale,
          status: checks.every((check) => check.pass) ? "passed_automatic" : "failed_automatic",
          checks,
          model: telemetry.model,
          inputTokens: telemetry.inputTokens,
          outputTokens: telemetry.outputTokens,
          estimatedCostPln: costPln,
          reportFile,
        });
        if (actualCostPln > maxCostPln) {
          results.push({ id: item.id, locale, status: "failed_automatic", checks: [], errorCategory: "OPENAI_EVAL_COST_CAP_EXCEEDED" });
          break caseLoop;
        }
      } catch (error) {
        results.push({
          id: item.id,
          locale,
          status: "failed_automatic",
          checks: [],
          errorCategory: error instanceof Error ? error.message.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 80) : "UNKNOWN",
        });
        continue;
      }
    }
  }

  const safeSummary = results.map(({ reportFile, ...result }) => {
    void reportFile;
    return result;
  });
  writeFileSync(join(outputDir, "summary.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    model: process.env.OPENAI_REVIEW_MODEL,
    maxCostPln,
    costSafetyFactor,
    alreadySpentPln,
    selectedCaseIds: cases.map((item) => item.id),
    rawWorstCaseCostPln,
    worstCaseCostPln,
    actualCostPln,
    results: safeSummary,
  }, null, 2)}\n`, { mode: 0o600 });

  const manualReview = [
    "# CV Unfold live-model manual review",
    "",
    "Synthetic data only. Mark every checkbox before considering the live-model gate complete.",
    "",
    ...results.filter((result) => result.reportFile).flatMap((result) => [
      `## ${result.id} / ${result.locale}`,
      `Report: \`${result.reportFile}\``,
      "",
      ...manualReviewQuestions.map((question) => `- [ ] ${question}`),
      "",
    ]),
  ].join("\n");
  writeFileSync(join(outputDir, "manual-review.md"), `${manualReview}\n`, { mode: 0o600 });

  const automaticPassed = results.length === cases.length * locales.length && results.every((result) => result.status === "passed_automatic" || result.status === "rejected_before_model");
  console.log(`Automatic live-model gate: ${automaticPassed ? "PASS" : "FAIL"}. Actual estimated cost: ${actualCostPln.toFixed(2)} PLN.`);
  console.log(`Temporary review bundle: ${outputDir}`);
  console.log("Manual review remains required; full synthetic reports were not written to the repository or analytics.");
  process.exitCode = automaticPassed ? 0 : 1;
}

main().catch((error) => {
  const category = error instanceof Error ? error.message.replace(/[^A-Z0-9_:. -]/gi, "_").slice(0, 160) : "UNKNOWN";
  console.error(`Live eval stopped: ${category}`);
  process.exitCode = 1;
});
