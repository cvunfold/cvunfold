import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseDocument, type Segment } from "../src/lib/document-parsing";
import { reviewWithOpenAI } from "../src/lib/ai/openai-review";
import { validateAssessment, scoreAssessment, ASSESSMENT_VERSION, ASSESSMENT_VALIDATION_VERSION, type EvidenceAssessment } from "../src/lib/ai/evidence-assessment";
import { evaluateLiveReport } from "../src/lib/ai/live-eval";
import { summarizeScoreStability, type ScoreObservation } from "../src/lib/ai/stability-metrics";
import { RUBRIC_CATEGORY_KEYS, type CVReport } from "../src/lib/ai/schemas/report";
import { resolveModelPricing } from "../src/lib/ai/model-pricing";
import { REVIEW_PIPELINE_VERSION } from "../src/lib/ai/review-provenance";
import { getRubric, RUBRIC_VERSION } from "../src/lib/rubrics/technical-v1";
import { calculateOverall } from "../src/lib/ai/validate-report";

const groupId = "85062a79-24f2-44f7-87b8-2e7a038b74e1";
const schoolId = "745e1c96-605c-40fe-a5b6-0d58cc2a838f";
const orgId = "org-eP9OmspMRVVNhtchUid7mHoo";
const projectId = "proj_SL3YR6PScXe3vj52C31b1FyJ";
const manifestPath = "/private/tmp/cvunfold-school-20261012/manifest.json";
type Fixture = { name: string; locale: "pl" | "en"; slug: string; path: string };
type FixtureInput = Fixture & { segments: Segment[]; assessment: EvidenceAssessment; report: CVReport };

// Historical interpretation for the fixed baseline, never used by production.
function legacyScore(assessment: EvidenceAssessment) {
  const categoryScores = getRubric(assessment.evaluatedStage, "frontend_developer", "pl", "first_job").map(category => {
    const finding = assessment.categories.find(item => item.key === category.key)!;
    const concerns = assessment.concerns.filter(item => item.category === category.key);
    const cap = concerns.some(item => item.severity === "critical") ? 65 : concerns.some(item => item.severity === "important") ? 79 : 100;
    return { ...category, score: Math.min(20 + finding.signals.filter(signal => signal.satisfied).length * 14, cap), rationale: "", evidenceRefs: [] };
  });
  return { score: calculateOverall(categoryScores), categories: Object.fromEntries(categoryScores.map(category => [category.key, category.score])) as ScoreObservation["categories"] };
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Fixture[];
  const repeats = 3, budgetPln = 10, analyses = manifest.length * 2 * repeats;
  const pricing = resolveModelPricing("gpt-6-luna");
  const reservePerAnalysisPln = (40_000 * pricing.inputUsdPerMillion + 16_000 * pricing.outputUsdPerMillion) / 1e6 * 5;
  if (manifest.length !== 10 || pricing.source !== "table" || analyses * reservePerAnalysisPln > budgetPln) throw new Error("INVALID_EVAL_PREFLIGHT");
  console.log(JSON.stringify({ cases: manifest.length, repeats, languages: ["pl", "en"], analyses, budgetPln, maximumReservedPln: analyses * reservePerAnalysisPln, rubricVersion: RUBRIC_VERSION, pipelineVersion: REVIEW_PIPELINE_VERSION }));
  if (!process.argv.includes("--execute")) return;
  if (process.env.OPENAI_ORG_ID !== orgId || process.env.OPENAI_PROJECT_ID !== projectId || process.env.OPENAI_REVIEW_MODEL !== "gpt-6-luna" || process.env.OPENAI_REVIEW_DISABLE_FALLBACK !== "true" || process.env.OPENAI_REVIEW_MAX_RETRIES !== "0" || !process.env.OPENAI_API_KEY) throw new Error("OPENAI_PREFLIGHT_REQUIRED");
  if (new URL(process.env.SUPABASE_URL || "").hostname !== "yttktyctjbciyqjpvunv.supabase.co") throw new Error("DATABASE_OWNERSHIP_MISMATCH");
  const resumeDir = process.env.OPENAI_EVAL_RESUME_DIR;
  if (resumeDir && (!resumeDir.startsWith(join(tmpdir(), "cvunfold-score-scale-")) || !process.argv.includes("--retry-failed"))) throw new Error("INVALID_RESUME_DIRECTORY");
  const previous = resumeDir ? JSON.parse(readFileSync(join(resumeDir, "summary.json"), "utf8")) : undefined;
  if (previous && (previous.rubricVersion !== RUBRIC_VERSION || previous.assessmentVersion !== ASSESSMENT_VERSION || previous.pipelineVersion !== REVIEW_PIPELINE_VERSION || previous.expectedAnalyses !== analyses || previous.stopped)) throw new Error("RESUME_PROVENANCE_MISMATCH");
  const outputDir = resumeDir || mkdtempSync(join(tmpdir(), "cvunfold-score-scale-"));
  const previousCalls = resumeDir ? JSON.parse(readFileSync(join(resumeDir, "preflight.json"), "utf8")) : undefined;
  if (previousCalls && (previousCalls.project !== `CVUnfold / ${projectId}` || previousCalls.organization !== `Personal / ${orgId}`)) throw new Error("RESUME_OWNERSHIP_MISMATCH");
  const preflight = {
    verifiedAt: new Date().toISOString(), authorization: "Owner requested scale correction and repeated paid checks on the same ten synthetic school CVs; existing key reuse approved in this conversation.",
    service: "OpenAI Platform", account: "Owner private business, existing owner-confirmed local key",
    organization: `Personal / ${orgId}`, project: `CVUnfold / ${projectId}`, environment: "Local synthetic CVUnfold evaluation; store:false; no fallback or automatic retries",
    database: { service: "Supabase", account: "pawelmaczkaczarnecki@gmail.com", organization: "CVUnfold / knjrcparhtiwcskiisjh", project: "cvunfold-prod / yttktyctjbciyqjpvunv", environment: "main / PRODUCTION, read-only exact fictional school/group", schoolId, groupId },
    budgetPln, reservePerAnalysisPln, calls: [...(previousCalls?.calls || [])] as Array<{ id: string; at: string; reservedPln: number }>,
  };
  const save = (path: string, value: unknown) => writeFileSync(join(outputDir, path), JSON.stringify(value, null, 2), { mode: 0o600 });
  save("preflight.json", preflight);
  console.log(`Private synthetic review directory: ${outputDir}`);
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "", { auth: { persistSession: false } });
  const group = await db.from("school_groups").select("school_id,target_role,target_seniority").eq("id", groupId).single();
  if (group.error || group.data.school_id !== schoolId || group.data.target_role !== "frontend_developer" || group.data.target_seniority !== "first_job") throw new Error("GROUP_SCOPE_INVALID");
  const stored = await db.from("analyses").select("school_student_name,status,paid_at,review_provenance,reports(full_report_json)").eq("school_group_id", groupId);
  if (stored.error || stored.data.length !== 10) throw new Error("BASELINE_READ_FAILED");
  const inputs: FixtureInput[] = [];
  const replay: Array<Record<string, unknown>> = [];
  for (const fixture of manifest) {
    if (!fixture.path.startsWith("/private/tmp/cvunfold-school-20261012/pdfs/")) throw new Error("INVALID_FIXTURE_PATH");
    const row = stored.data.find(item => item.school_student_name === fixture.name)!;
    if (!row || row.status !== "complete" || row.paid_at || row.review_provenance.model !== "gpt-6-luna" || row.review_provenance.fallbackUsed) throw new Error("BASELINE_PROVENANCE_INVALID");
    const report = (Array.isArray(row.reports) ? row.reports[0] : row.reports).full_report_json as CVReport;
    if (report.rubricVersion !== "technical-v2.1.2" || report.evidenceAssessment?.version !== `${ASSESSMENT_VERSION}+${ASSESSMENT_VALIDATION_VERSION}`) throw new Error("BASELINE_VERSION_MISMATCH");
    const bytes = readFileSync(fixture.path);
    const parsed = await parseDocument(new File([bytes], `${fixture.slug}.pdf`, { type: "application/pdf" }));
    const assessment = validateAssessment(report.evidenceAssessment.checks, parsed.segments, "first_job", "first_job");
    const before = legacyScore(assessment);
    if (before.score !== report.summary.overallScore || RUBRIC_CATEGORY_KEYS.some(key => before.categories[key] !== report.categoryScores.find(category => category.key === key)?.score)) throw new Error("BASELINE_REPLAY_MISMATCH");
    const after = scoreAssessment(assessment, "frontend_developer", "first_job", "pl", "first_job");
    replay.push({ id: fixture.slug, name: fixture.name, sourceHash: createHash("sha256").update(bytes).digest("hex"), before: before.score, after: after.overallScore, oldDecision: report.recruiterSimulation.simulatedDecision, newDecision: after.simulatedDecision, beforeCategories: before.categories, afterCategories: Object.fromEntries(after.categoryScores.map(category => [category.key, category.score])) });
    inputs.push({ ...fixture, segments: parsed.segments, assessment, report });
  }
  save("baseline-replay.json", replay);
  const rows: Array<ScoreObservation & Record<string, unknown>> = [...(previous?.rows || [])];
  const errors: Array<Record<string, unknown>> = [...(previous?.errors || [])];
  const completedIds = new Set(rows.map(row => `${row.id}-${row.locale}-${row.repeat}`));
  const failedIds = new Set(errors.map(error => error.id));
  const tasks = Array.from({ length: repeats }, (_, i) => i + 1).flatMap(repeat => inputs.flatMap(item => (["pl", "en"] as const).map(locale => ({ item, locale, repeat })))).filter(task => !previous || (!completedIds.has(`${task.item.slug}-${task.locale}-${task.repeat}`) && failedIds.has(`${task.item.slug}-${task.locale}-${task.repeat}`)));
  if ((preflight.calls.length + tasks.length) * reservePerAnalysisPln > budgetPln) throw new Error("RESUME_BUDGET_TOO_SMALL");
  if (previous) save("initial-summary.json", previous.initialAttempt || previous);
  let next = 0, stopped = false;
  function persist() {
    const normalizedRows = rows.map(row => {
      // Compare classification variability at the predeclared legacy evidence
      // anchors. Wider displayed steps must not silently loosen the quality gate.
      const old = row.legacy as ReturnType<typeof legacyScore>;
      return { ...row, score: old.score, categories: old.categories, rubricVersion: "technical-v2.1.2" };
    });
    const baselineComparisons = rows.map(row => {
      const old = row.legacy as ReturnType<typeof legacyScore>;
      const baseline = replay.find(item => item.id === row.id)!;
      const beforeCategories = baseline.beforeCategories as ScoreObservation["categories"];
      return { id: row.id, locale: row.locale, repeat: row.repeat, delta: Math.abs(old.score - Number(baseline.before)), maxCategoryDelta: Math.max(...RUBRIC_CATEGORY_KEYS.map(key => Math.abs(old.categories[key] - beforeCategories[key]))), decisionChanged: row.decision !== baseline.oldDecision, levelChanged: row.level !== inputs.find(item => item.slug === row.id)!.report.document.perceivedSeniority };
    });
    save("summary.json", { rubricVersion: RUBRIC_VERSION, assessmentVersion: ASSESSMENT_VERSION, pipelineVersion: REVIEW_PIPELINE_VERSION, source: "same ten original PDF files; same original-language input for both report languages", expectedAnalyses: analyses, attemptedAnalyses: preflight.calls.length, initialAttempt: previous ? { successful: previous.initialAttempt?.successful ?? previous.rows.length, errors: previous.initialAttempt?.errors ?? previous.errors, attemptedAnalyses: previous.initialAttempt?.attemptedAnalyses ?? previous.attemptedAnalyses ?? previousCalls.calls.length } : undefined, rows, errors, replay, baselineComparisons, exactRepeatedGroups: [...new Set(rows.map(row => `${row.id}:${row.locale}`))].filter(key => { const group = rows.filter(row => `${row.id}:${row.locale}` === key); return group.length === repeats && new Set(group.map(row => row.score)).size === 1; }).length, displayedScale: summarizeScoreStability(rows.map(row => ({ ...row, rubricVersion: undefined })), repeats), fixedEvidenceScale: summarizeScoreStability(normalizedRows, repeats), successfulEstimatedCostUsd: rows.reduce((sum, row) => sum + Number(row.estimatedCostUsd), 0), reservedPln: preflight.calls.length * reservePerAnalysisPln, billingNote: "Successful-response estimate excludes unreturned usage on failures; every attempt is conservatively reserved. Provider billing not reconciled.", budgetPln, stopped });
  }
  async function worker() {
    while (!stopped && next < tasks.length) {
      const { item, locale, repeat } = tasks[next++];
      const id = `${item.slug}-${locale}-${repeat}`;
      const attempt = preflight.calls.filter(call => call.id === id).length + 1;
      preflight.calls.push({ id, at: new Date().toISOString(), reservedPln: reservePerAnalysisPln });
      save("preflight.json", preflight); // Record all five ownership fields before each analysis.
      try {
        const result = await reviewWithOpenAI({ segments: item.segments, targetRole: "frontend_developer", targetSeniority: "first_job", careerContext: "first_job", locale, maxOutputTokens: 8000, onRejectedAssessment: raw => save(`rejected-${id}-attempt-${attempt}.json`, raw) });
        const checks = evaluateLiveReport(result.report, item.segments, locale);
        const locked = scoreAssessment(result.assessment!, "frontend_developer", "first_job", locale, "first_job");
        checks.push({ name: "all locked category scores retained", pass: locked.categoryScores.every(category => result.report.categoryScores.find(c => c.key === category.key)?.score === category.score) });
        checks.push({ name: "early-career scope retained", pass: ["junior", "unclear"].includes(result.report.document.perceivedSeniority) });
        checks.push({ name: "rewrites use an exact original source excerpt", pass: result.report.issues.every(issue => !issue.suggestion?.original || item.segments.some(segment => segment.text.includes(issue.suggestion!.original!))) });
        if (result.telemetry.provenance.fallbackUsed || result.telemetry.provenance.calibrationViolations.length || checks.some(check => !check.pass)) stopped = true;
        save(`${id}.json`, result);
        rows.push({ id: item.slug, locale, repeat, rubricVersion: result.report.rubricVersion, score: result.report.summary.overallScore, categories: Object.fromEntries(result.report.categoryScores.map(category => [category.key, category.score])) as ScoreObservation["categories"], decision: result.report.recruiterSimulation.simulatedDecision, level: result.report.document.perceivedSeniority, checks, criteria: Object.fromEntries(result.assessment!.categories.map(category => [category.key, category.signals.map(signal => signal.satisfied)])), concerns: result.assessment!.concerns.map(concern => ({ category: concern.category, severity: concern.severity, kind: concern.kind, diagnosticKind: concern.diagnosticKind })), legacy: legacyScore(result.assessment!), estimatedCostUsd: result.telemetry.estimatedCost, provenance: result.telemetry.provenance });
        console.log(`${id}: ${result.report.summary.overallScore}, checks ${checks.every(check => check.pass) ? "PASS" : "FAIL"} (${rows.length}/${analyses})`);
      } catch (error) {
        const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "MODEL_REQUEST_FAILED";
        errors.push({ id, code, reservedPln: reservePerAnalysisPln });
        console.log(`${id}: ${code}`);
      }
      persist();
    }
  }
  await Promise.all(Array.from({ length: 3 }, () => worker()));
  persist();
  console.log(JSON.stringify({ complete: rows.length === analyses, successful: rows.length, failed: errors.length, stopped, outputDir }));
}
main().catch(error => {
  const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "UNCLASSIFIED_EVALUATION_ERROR";
  console.error(JSON.stringify({ stopped: true, code, errorType: error instanceof Error ? error.name : "unknown" }));
  process.exitCode = 1;
});
