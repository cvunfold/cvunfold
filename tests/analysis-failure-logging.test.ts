import { describe, expect, it } from "vitest";
import { UnreadableDocumentError } from "@/lib/document-parsing";
import { buildSafeAnalysisFailureLog } from "@/lib/observability/analysis-failure";

describe("analysis failure logging", () => {
  it("logs extraction metadata without file or document contents", () => {
    const error = new UnreadableDocumentError({
      document_kind: "pdf",
      file_size_bucket: "100_kb_to_1_mb",
      parser: "pdf-parse",
      parser_version: "v2.0.550",
      page_count: 2,
      pages_attempted: 2,
      pages_processed: 2,
      pages_with_text: 0,
      text_item_count: 0,
      page_extraction_failures: 0,
      extracted_chars: 0,
      threshold_chars: 120,
      reason: "pdf_no_text_items",
    });
    const log = buildSafeAnalysisFailureLog({
      code: "UNREADABLE_DOCUMENT",
      durationMs: 125.4,
      error,
      requestId: "fra1::safe-request-id",
    });
    expect(log).toMatchObject({
      level: "error",
      event: "analysis_failed",
      route: "/api/analyses",
      code: "UNREADABLE_DOCUMENT",
      duration_ms: 125,
      request_id: "fra1::safe-request-id",
      extraction: { reason: "pdf_no_text_items", extracted_chars: 0 },
    });
    expect(JSON.stringify(log)).not.toMatch(/filename|document_text|private parser detail/i);
  });

  it("drops an untrusted request id instead of logging it", () => {
    const log = buildSafeAnalysisFailureLog({
      code: "ANALYSIS_FAILED",
      durationMs: 1,
      error: new Error("raw private error text"),
      requestId: "unsafe\nprivate-value",
    });
    expect(log).not.toHaveProperty("request_id");
    expect(JSON.stringify(log)).not.toContain("raw private error text");
  });
});
