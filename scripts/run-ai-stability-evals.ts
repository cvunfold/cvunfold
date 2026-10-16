import { hasAffirmativeManualRoutingClaim } from "../src/lib/ai/manual-routing-tripwire";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSegments } from "../src/lib/document-parsing";
import { reviewWithOpenAI } from "../src/lib/ai/openai-review";
import { ASSESSMENT_VERSION, ASSESSMENT_VALIDATION_VERSION, type EvidenceAssessment } from "../src/lib/ai/evidence-assessment";
import { evaluateLiveReport, evaluateLocaleParity, type LiveEvalCase } from "../src/lib/ai/live-eval";
import type { CVReport } from "../src/lib/ai/schemas/report";
import { RUBRIC_CATEGORY_KEYS } from "../src/lib/ai/schemas/report";
import { resolveModelPricing } from "../src/lib/ai/model-pricing";
import { resolveReviewModel } from "../src/lib/ai/model-config";
import { REVIEW_PIPELINE_VERSION } from "../src/lib/ai/review-provenance";
import { ASSESSMENT_REPORT_PROMPT_VERSION } from "../src/lib/ai/assessment-report-prompt";

async function main() {
const reviewModel = resolveReviewModel();
const corpus = process.env.OPENAI_EVAL_CORPUS || "ai";
const corpusFiles: Record<string, string> = { ai: "fixtures/ai-role-eval-cases.json", modular: "fixtures/modular-eval-cases.json", regression: "fixtures/modular-regression-eval-cases.json" };
if (!corpusFiles[corpus]) throw new Error("INVALID_EVAL_CORPUS");
const cases = JSON.parse(readFileSync(corpusFiles[corpus], "utf8")) as LiveEvalCase[];
const requested = (process.env.OPENAI_EVAL_CASE_IDS || "").split(",").filter(Boolean);
if (requested.some(id => !cases.some(item => item.id === id))) throw new Error("UNKNOWN_CASE");
const selected = requested.length ? cases.filter(item => requested.includes(item.id)) : cases;
const concurrency = Number(process.env.OPENAI_EVAL_CONCURRENCY || 3);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6) throw new Error("INVALID_EVAL_CONCURRENCY");
const repeats = Number(process.env.OPENAI_EVAL_REPEATS || 3);
const budget = Number(process.env.OPENAI_EVAL_MAX_COST_PLN || 15);
if (![1, 2, 3].includes(repeats) || !Number.isFinite(budget) || budget <= 0 || budget > 20) throw new Error("INVALID_EVAL_LIMITS");
const priorReservePln = Number(process.env.OPENAI_EVAL_ALREADY_SPENT_PLN || 0);
if (!Number.isFinite(priorReservePln) || priorReservePln < 0 || priorReservePln >= budget) throw new Error("INVALID_PRIOR_RESERVE");
const cacheDir = process.env.OPENAI_EVAL_ASSESSMENT_CACHE_DIR;
if (cacheDir && !cacheDir.startsWith(join(tmpdir(), "cvunfold-ai-stability-"))) throw new Error("INVALID_CACHE_DIRECTORY");
const cachedAssessments = new Map<string, EvidenceAssessment>();
if (cacheDir) for (let repeat = 1; repeat <= repeats; repeat++) for (const item of selected) for (const locale of ["pl", "en"] as const) {
  const id = `${item.id}-${locale}-${repeat}`;
  let cached;
  try { cached = JSON.parse(readFileSync(join(cacheDir, `${id}.json`), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
  const provenance = cached.telemetry.provenance;
  if (provenance.assessmentVersion !== ASSESSMENT_VERSION || provenance.model !== reviewModel || provenance.fallbackUsed) throw new Error("CACHE_PROVENANCE_MISMATCH");
  cachedAssessments.set(id, cached.assessment);
}
const pricing = resolveModelPricing(reviewModel);
if (pricing.source !== "table") throw new Error("UNKNOWN_MODEL_PRICING");
// Includes two stages, duplicated prompt/evidence, locked assessment, and up to
// three attempts per stage. Reserve failed attempts before issuing each analysis.
const reservePerAnalysis = ((40_000 * pricing.inputUsdPerMillion + 16_000 * pricing.outputUsdPerMillion) / 1e6) * 5 * (process.env.OPENAI_REVIEW_MAX_RETRIES === "0" ? 1 : 3);
const reservePerCachedAnalysis = ((30_000 * pricing.inputUsdPerMillion + 8_000 * pricing.outputUsdPerMillion) / 1e6) * 5 * (process.env.OPENAI_REVIEW_MAX_RETRIES === "0" ? 1 : 3);
const worstCasePln = priorReservePln + reservePerAnalysis * (selected.length * 2 * repeats - cachedAssessments.size) + reservePerCachedAnalysis * cachedAssessments.size;
if (worstCasePln > budget) throw new Error("EVAL_BUDGET_TOO_SMALL");
console.log(JSON.stringify({ model: reviewModel, cases: selected.length, repeats, analyses: selected.length * 2 * repeats, modelCalls: selected.length * 4 * repeats - cachedAssessments.size, cachedAssessments: cachedAssessments.size, worstCasePln, budget, assessmentVersion: ASSESSMENT_VERSION, pipelineVersion: REVIEW_PIPELINE_VERSION }));
if (!process.argv.includes("--execute")) process.exit(0);
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_ORG_ID !== "org-eP9OmspMRVVNhtchUid7mHoo" || process.env.OPENAI_PROJECT_ID !== "proj_SL3YR6PScXe3vj52C31b1FyJ" || process.env.OPENAI_REVIEW_DISABLE_FALLBACK !== "true") throw new Error("CVUNFOLD_PREFLIGHT_REQUIRED");
const resumeDir = process.env.OPENAI_EVAL_RESUME_DIR;
if (resumeDir && !resumeDir.startsWith(join(tmpdir(), "cvunfold-ai-stability-"))) throw new Error("INVALID_RESUME_DIRECTORY");
const outputDir = resumeDir || mkdtempSync(join(tmpdir(), "cvunfold-ai-stability-"));
console.log(`Private review bundle: ${outputDir}`);
const rows: Array<Record<string, unknown>> = [];
const reports = new Map<string, CVReport>();
let estimatedCostPln = 0;
let reservedPln = priorReservePln;
const previousAttempts: Array<Record<string, unknown>> = [];
if (resumeDir) {
  const previous = JSON.parse(readFileSync(join(resumeDir, "summary.json"), "utf8"));
  if (previous.assessmentVersion !== ASSESSMENT_VERSION || previous.pipelineVersion !== REVIEW_PIPELINE_VERSION) throw new Error("RESUME_PROVENANCE_MISMATCH");
  estimatedCostPln = previous.estimatedCostPln;
  // Preserve the cumulative reservation for completed and failed requests,
  // plus three possibly in-flight analyses from the interrupted process.
  const reconciled = process.env.OPENAI_EVAL_RECONCILED_PRIOR_RESERVE_PLN;
  if (reconciled) {
    const value = Number(reconciled);
    if (!Number.isFinite(value) || value < previous.estimatedCostPln || value >= budget) throw new Error("INVALID_RECONCILED_RESERVE");
    reservedPln = value;
  } else reservedPln = previous.reservedPln + reservePerAnalysis * 3;
  previousAttempts.push(...(previous.previousAttempts || []));
  for (const row of previous.rows) {
    if (row.error) { previousAttempts.push(row); continue; }
    if (row.provenance.model !== reviewModel || !row.provenance.promptVersion.includes(ASSESSMENT_REPORT_PROMPT_VERSION)) throw new Error("RESUME_MODEL_MISMATCH");
    const id = `${row.id}-${row.locale}-${row.repeat}`;
    const report = JSON.parse(readFileSync(join(resumeDir, `${id}.json`), "utf8")).report as CVReport;
    const tripwire = row.checks?.find((check: { name: string }) => check.name.includes("operational routing"));
    if (tripwire && row.id === "ai-llm-api-only") {
      const assertions = [report.summary.strongestSignal, ...report.strengths.map(strength => strength.explanation), ...report.categoryScores.map(category => category.rationale)].join(" ");
      const pass = !hasAffirmativeManualRoutingClaim(assertions);
      if (pass !== tripwire.pass) row.tripwireAdjudication = { previousAutomaticPass: tripwire.pass, correctedPass: pass, reason: "Updated alarm distinguishes negated routing from affirmative claims; manually reviewed before resume." };
      tripwire.pass = pass;
    }
    rows.push(row);
    reports.set(id, report);
  }
}
const tasks = Array.from({ length: repeats }, (_, index) => index + 1).flatMap(repeat => selected.flatMap(item => (["pl", "en"] as const).map(locale => ({ repeat, item, locale })))).filter(task => !reports.has(`${task.item.id}-${task.locale}-${task.repeat}`));
if (reservedPln + tasks.reduce((sum, task) => sum + (cachedAssessments.has(`${task.item.id}-${task.locale}-${task.repeat}`) ? reservePerCachedAnalysis : reservePerAnalysis), 0) > budget) throw new Error("RESUME_BUDGET_TOO_SMALL");
let nextTask = 0;
let factualStop = false;
async function worker() {
while (!factualStop && nextTask < tasks.length) {
  const { repeat, item, locale } = tasks[nextTask++];
  const id = `${item.id}-${locale}-${repeat}`;
  const cachedAssessment = cachedAssessments.get(id);
  const reserve = cachedAssessment ? reservePerCachedAnalysis : reservePerAnalysis;
  if (reservedPln + reserve > budget) throw new Error("EVAL_BUDGET_REACHED");
  reservedPln += reserve;
  try {
    const segments = createSegments(item.cv[locale]);
    const result = await reviewWithOpenAI({ segments, targetRole: item.targetRole, targetSeniority: item.targetSeniority, careerContext: item.careerContext, jobDescription: item.jobDescription?.[locale], locale, maxOutputTokens: 8000, cachedAssessment,
      onRejectedAssessment: raw => writeFileSync(join(outputDir, `rejected-${id}-${Date.now()}.json`), JSON.stringify(raw), { mode: 0o600 }),
    });
    const checks = evaluateLiveReport(result.report, segments, locale, item);
    if (item.id === "ai-llm-api-only") {
      const assertions = [result.report.summary.strongestSignal, ...result.report.strengths.map(strength => strength.explanation), ...result.report.categoryScores.map(category => category.rationale)].join(" ");
      checks.push({ name: "manual-review category is not upgraded to operational routing", pass: !hasAffirmativeManualRoutingClaim(assertions) });
    }
    estimatedCostPln += (result.telemetry.estimatedCost || 0) * 5;
    if (checks.some(check => check.name.includes("operational routing") && !check.pass)) factualStop = true;
    reports.set(id, result.report);
    writeFileSync(join(outputDir, `${id}.json`), JSON.stringify(result), { mode: 0o600 });
    rows.push({ id: item.id, locale, repeat, score: result.report.summary.overallScore, rubricVersion: result.report.rubricVersion,
      categories: Object.fromEntries(result.report.categoryScores.map(category => [category.key, category.score])),
      decision: result.report.recruiterSimulation.simulatedDecision, level: result.report.document.perceivedSeniority,
      checks, calibrationViolations: result.telemetry.provenance.calibrationViolations,
      criteria: Object.fromEntries(RUBRIC_CATEGORY_KEYS.map(key => [key, result.assessment!.categories.find(item => item.key === key)!.signals.map(signal => signal.satisfied)])),
      provenance: result.telemetry.provenance,
    });
    console.log(`${id}: score ${result.report.summary.overallScore}, checks ${checks.every(check => check.pass) ? "PASS" : "FAIL"}, estimate ${estimatedCostPln.toFixed(3)} PLN`);
  } catch (error) {
    rows.push({ id: item.id, locale, repeat, error: error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : error instanceof SyntaxError ? "MODEL_JSON_PARSE_FAILED" : "MODEL_REQUEST_FAILED", diagnostic: error instanceof Error && /^[a-zA-Z0-9_]{1,60}$/.test(error.name) ? error.name : "unknown" });
    console.log(`${id}: FAILED`);
  }
  const parity = selected.flatMap(item => Array.from({ length: repeats }, (_, index) => {
    const repeat = index + 1;
    const pl = reports.get(`${item.id}-pl-${repeat}`), en = reports.get(`${item.id}-en-${repeat}`);
    return pl && en ? [{ id: item.id, repeat, checks: evaluateLocaleParity(pl, en) }] : [];
  }).flat());
  writeFileSync(join(outputDir, "summary.json"), JSON.stringify({ assessmentVersion: ASSESSMENT_VERSION, assessmentValidationVersion: ASSESSMENT_VALIDATION_VERSION, cachedAssessmentCount: cachedAssessments.size, priorReservePln, pipelineVersion: REVIEW_PIPELINE_VERSION, budget, worstCasePln, reservedPln, estimatedCostPln, previousAttempts, rows, parity }, null, 2), { mode: 0o600 });
}
}
await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
console.log(`${factualStop ? "Stopped on factual regression" : "Finished"}. Manual factual review required: ${outputDir}`);

}
main().catch(() => { console.error("EVALUATION_STOPPED"); process.exitCode = 1; });
