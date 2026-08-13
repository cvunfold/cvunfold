import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getUnreadableDocumentDiagnostics,
  parseDocument,
} from "../../src/lib/document-parsing";
import { validateCvText } from "../../src/lib/document-parsing/cv-detection";
import { validateSignature, validateUpload } from "../../src/lib/security/upload";
import { POST as createAnalysis } from "../../src/app/api/analyses/route";

type ManifestCase = {
  id: number;
  file: string;
  format: "pdf" | "docx";
  case: string;
  expected_code: string;
  expected_reason?: string;
};

type MatrixResult = ManifestCase & {
  actual_code: string;
  actual_reason?: string;
  stage: "upload" | "signature" | "extraction" | "cv_detection" | "accepted";
  matched: boolean;
  extraction?: {
    quality: "good" | "degraded";
    extracted_chars: number;
    segment_count: number;
    cv_score: number;
    cv_confidence: "low" | "medium" | "high";
  };
  diagnostics?: ReturnType<typeof getUnreadableDocumentDiagnostics>;
  endpoint?: { status: number; outcome: "success" | "controlled_rejection" | "uncontrolled_failure"; error_category?: string };
};

const controlledCodes = new Set([
  "EMPTY_FILE",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_FILE_SIGNATURE",
  "INVALID_FILE_MIME",
  "DOCX_ARCHIVE_UNSAFE",
  "UNREADABLE_DOCUMENT",
  "DOCUMENT_TEXT_TOO_LONG",
  "NOT_A_CV",
]);

function safeCode(error: unknown): string {
  if (getUnreadableDocumentDiagnostics(error)) return "UNREADABLE_DOCUMENT";
  if (error instanceof Error && controlledCodes.has(error.message)) return error.message;
  return "ANALYSIS_FAILED";
}

function mime(format: ManifestCase["format"]): string {
  return format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

async function runCase(root: string, item: ManifestCase): Promise<MatrixResult> {
  const bytes = await readFile(path.join(root, item.file));
  const file = new File([bytes], item.file, { type: mime(item.format) });
  let stage: MatrixResult["stage"] = "upload";
  try {
    validateUpload(file);
    stage = "signature";
    await validateSignature(file);
    stage = "extraction";
    const parsed = await parseDocument(file);
    stage = "cv_detection";
    const cv = validateCvText(parsed.text);
    const actual_code = "ACCEPTED";
    return {
      ...item,
      actual_code,
      stage: "accepted",
      matched: actual_code === item.expected_code && !item.expected_reason,
      extraction: {
        quality: parsed.quality,
        extracted_chars: parsed.text.length,
        segment_count: parsed.segments.length,
        cv_score: cv.score,
        cv_confidence: cv.confidence,
      },
    };
  } catch (error) {
    const diagnostics = getUnreadableDocumentDiagnostics(error);
    const actual_code = safeCode(error);
    const actual_reason = diagnostics?.reason;
    return {
      ...item,
      actual_code,
      ...(actual_reason ? { actual_reason } : {}),
      stage,
      matched: actual_code === item.expected_code && (item.expected_reason === undefined || actual_reason === item.expected_reason),
      ...(diagnostics ? { diagnostics } : {}),
    };
  }
}

async function runEndpointCase(root: string, item: ManifestCase): Promise<NonNullable<MatrixResult["endpoint"]>> {
  const bytes = await readFile(path.join(root, item.file));
  const form = new FormData();
  form.set("file", new File([bytes], item.file, { type: mime(item.format) }));
  form.set("role", "frontend_developer");
  form.set("seniority", "auto");
  form.set("locale", "pl");
  form.set("jobDescription", "");
  form.set("attribution", "{}");
  const response = await createAnalysis(new Request("http://localhost/api/analyses", {
    method: "POST",
    headers: { "x-forwarded-for": `127.25.0.${item.id}`, "x-vercel-id": `local::document-matrix-${item.id}` },
    body: form,
  }));
  const payload = await response.json().catch(() => ({})) as { errorCategory?: string };
  return {
    status: response.status,
    outcome: response.ok ? "success" : response.status >= 500 ? "uncontrolled_failure" : "controlled_rejection",
    ...(payload.errorCategory ? { error_category: payload.errorCategory } : {}),
  };
}

function markdown(results: MatrixResult[]): string {
  const passed = results.filter((item) => item.matched).length;
  const accepted = results.filter((item) => item.actual_code === "ACCEPTED").length;
  const lines = [
    "# Synthetic document matrix",
    "",
    `- Cases: ${results.length}`,
    `- Matched expected behavior: ${passed}/${results.length}`,
    `- Accepted by the full local preflight: ${accepted}`,
    `- Controlled rejections: ${results.filter((item) => item.actual_code !== "ACCEPTED" && item.actual_code !== "ANALYSIS_FAILED").length}`,
    `- Uncontrolled failures: ${results.filter((item) => item.actual_code === "ANALYSIS_FAILED").length}`,
    `- Endpoint success responses: ${results.filter((item) => item.endpoint?.outcome === "success").length}`,
    `- Endpoint controlled rejections: ${results.filter((item) => item.endpoint?.outcome === "controlled_rejection").length}`,
    `- Endpoint uncontrolled failures: ${results.filter((item) => item.endpoint?.outcome === "uncontrolled_failure").length}`,
    "",
    "| # | Fixture | Case | Expected | Actual | Endpoint | Match |",
    "|---:|---|---|---|---|---|:---:|",
    ...results.map((item) => {
      const expected = item.expected_reason ? `${item.expected_code}/${item.expected_reason}` : item.expected_code;
      const actual = item.actual_reason ? `${item.actual_code}/${item.actual_reason}` : item.actual_code;
      const endpoint = item.endpoint ? `${item.endpoint.status}/${item.endpoint.error_category || item.endpoint.outcome}` : "not-run";
      return `| ${item.id} | ${item.file} | ${item.case} | ${expected} | ${actual} | ${endpoint} | ${item.matched ? "yes" : "NO"} |`;
    }),
    "",
    "The report contains no extracted CV text or parser exception messages.",
    "",
  ];
  return lines.join("\n");
}

async function main() {
  const root = path.resolve(process.argv[2] || "");
  if (!process.argv[2]) throw new Error("Usage: tsx scripts/qa/run-document-matrix.ts <fixture-directory>");
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")) as ManifestCase[];
  const results: MatrixResult[] = [];
  const previousMockMode = process.env.MOCK_MODE;
  const previousDocumentQaMode = process.env.DOCUMENT_QA_MODE;
  const previousTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.MOCK_MODE = "true";
  process.env.DOCUMENT_QA_MODE = "true";
  delete process.env.TURNSTILE_SECRET_KEY;
  for (const item of manifest) {
    const result = await runCase(root, item);
    result.endpoint = await runEndpointCase(root, item);
    results.push(result);
  }
  if (previousMockMode === undefined) delete process.env.MOCK_MODE; else process.env.MOCK_MODE = previousMockMode;
  if (previousDocumentQaMode === undefined) delete process.env.DOCUMENT_QA_MODE; else process.env.DOCUMENT_QA_MODE = previousDocumentQaMode;
  if (previousTurnstileSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY = previousTurnstileSecret;
  await writeFile(path.join(root, "results.json"), JSON.stringify(results, null, 2));
  await writeFile(path.join(root, "results.md"), markdown(results));
  console.log(JSON.stringify({
    cases: results.length,
    matched: results.filter((item) => item.matched).length,
    accepted: results.filter((item) => item.actual_code === "ACCEPTED").length,
    controlled_rejections: results.filter((item) => item.actual_code !== "ACCEPTED" && item.actual_code !== "ANALYSIS_FAILED").length,
    uncontrolled_failures: results.filter((item) => item.actual_code === "ANALYSIS_FAILED").length,
    endpoint_successes: results.filter((item) => item.endpoint?.outcome === "success").length,
    endpoint_controlled_rejections: results.filter((item) => item.endpoint?.outcome === "controlled_rejection").length,
    endpoint_uncontrolled_failures: results.filter((item) => item.endpoint?.outcome === "uncontrolled_failure").length,
    mismatches: results.filter((item) => !item.matched).map((item) => ({ id: item.id, actual_code: item.actual_code, actual_reason: item.actual_reason })),
  }));
}

void main();
