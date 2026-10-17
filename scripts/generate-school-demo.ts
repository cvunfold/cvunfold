import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseDocument } from "../src/lib/document-parsing";
import { getSafeOpenAIErrorDiagnostic, reviewWithOpenAI } from "../src/lib/ai/openai-review";
import { reportSchema } from "../src/lib/ai/schemas/report";
import { calculateOverall } from "../src/lib/ai/validate-report";
import { runAtsChecker } from "../src/lib/ats-checker";
import { extractSchoolContact } from "../src/lib/schools/contact";
import { resolveReviewModel } from "../src/lib/ai/model-config";

type Fixture = { id: string; name: string; sourceUrl: string; caseTitle: string; description: string; text: string };
async function main() {
  const reviewModel = resolveReviewModel();
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
  process.env.OPENAI_ORG_ID = "org-eP9OmspMRVVNhtchUid7mHoo";
  process.env.OPENAI_PROJECT_ID = "proj_SL3YR6PScXe3vj52C31b1FyJ";
  process.env.OPENAI_REVIEW_DISABLE_FALLBACK = "true";
  process.env.OPENAI_REVIEW_TIMEOUT_MS = "180000";
  const fixtures: Fixture[] = JSON.parse(await readFile("fixtures/schools/cvs.json", "utf8"));
  if (fixtures.length !== 10) throw new Error("UNEXPECTED_CORPUS_SIZE");
  const output = `/private/tmp/cvunfold-school-demo-reviewed-${reviewModel}`;
  await mkdir(output, { recursive: true, mode: 0o700 });
  let cost = 0;
  for (const fixture of fixtures) {
    const path = `${output}/${fixture.id}.json`;
    let existing;
    try { existing = JSON.parse(await readFile(path, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (existing) {
      if (existing.telemetry?.provenance?.model !== reviewModel || existing.telemetry.provenance.fallbackUsed) throw new Error("CACHE_PROVENANCE_MISMATCH");
      cost += existing.telemetry.estimatedCost ?? 0.08;
      console.log(JSON.stringify({ id: fixture.id, cached: true })); continue;
    }
    if (cost + 0.08 > 1) throw new Error("DEMO_COST_CEILING");
    const bytes = await readFile(`public${fixture.sourceUrl}`);
    const file = new File([bytes], fixture.sourceUrl.split("/").pop()!, { type: "application/pdf" });
    const parsed = await parseDocument(file, { includeContact: true });
    const review = await reviewWithOpenAI({ segments: parsed.segments, targetRole: "frontend_developer", targetSeniority: "first_job", careerContext: "first_job", locale: "pl", maxOutputTokens: 8000 });
    const report = { ...review.report, ats: await runAtsChecker(file, parsed) };
    reportSchema.parse(report);
    if (report.summary.overallScore !== calculateOverall(report.categoryScores)) throw new Error("INVALID_SCORE");
    if (review.telemetry.provenance.calibrationViolations.length) throw new Error("CALIBRATION_REVIEW_REQUIRED");
    cost += review.telemetry.estimatedCost ?? 0.08;
    await writeFile(path, JSON.stringify({ ...fixture, text: parsed.text, contact: parsed.sourceContact ?? extractSchoolContact(parsed.text), report, generatedAt: new Date().toISOString(), telemetry: review.telemetry }, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ id: fixture.id, score: report.summary.overallScore, issues: report.issues.length, tokens: review.telemetry.inputTokens + review.telemetry.outputTokens, estimatedTotalUsd: Number(cost.toFixed(4)) }));
  }
}
main().catch(error => { console.error(JSON.stringify({ failure: getSafeOpenAIErrorDiagnostic(error), code: error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "GENERATION_STOPPED" })); process.exitCode = 1; });
