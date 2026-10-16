import { readFile, writeFile } from "node:fs/promises";
import { extractSchoolContact } from "../src/lib/schools/contact";
import { reportSchema } from "../src/lib/ai/schemas/report";
import { createSegments } from "../src/lib/document-parsing";
import { calculateOverall } from "../src/lib/ai/validate-report";
import { resolveReviewModel } from "../src/lib/ai/model-config";

async function main() {
  const reviewModel = resolveReviewModel();
  const fixtures = JSON.parse(await readFile("fixtures/schools/cvs.json", "utf8"));
  const outputs = [];
  for (const fixture of fixtures) {
    const raw = await readFile(`/private/tmp/cvunfold-school-demo-reviewed-${reviewModel}/${fixture.id}.json`, "utf8");
    // House punctuation only; diagnoses, scores and evidence are not editorially changed.
    const result = JSON.parse(raw.replace(/\u2014/g, "-"));
    if (result.telemetry?.provenance?.model !== reviewModel || result.telemetry.provenance.fallbackUsed) throw new Error("CACHE_PROVENANCE_MISMATCH");
    reportSchema.parse(result.report);
    if (result.report.summary.overallScore !== calculateOverall(result.report.categoryScores)) throw new Error("INVALID_SCORE");
    const segments = createSegments(result.text);
    if (Object.values(result.report.evidenceMap).some(quote => !segments.some(segment => segment.text === quote))) throw new Error("UNSUPPORTED_EVIDENCE");
    if (result.telemetry.provenance.calibrationViolations.length) throw new Error("CALIBRATION_REVIEW_REQUIRED");
    outputs.push({ ...result, contact: extractSchoolContact(fixture.text), caseTitle: fixture.caseTitle, description: fixture.description });
  }
  await writeFile("fixtures/schools/reports.json", JSON.stringify(outputs, null, 2));
  console.log(JSON.stringify({ published: outputs.length, scores: outputs.map(item => item.report.summary.overallScore) }));
}
main().catch(error => { console.error(error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "PUBLICATION_FAILED"); process.exitCode = 1; });
