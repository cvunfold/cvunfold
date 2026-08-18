import type { ParsedDocument } from "@/lib/document-parsing";
import { checkContactInfo, checkDateFormat, checkDatesAndTitles, checkGlyphArtifacts, checkSections } from "./text-checks";
import { checkTextLayer } from "./text-layer";
import { checkLayoutColumns, checkReadingOrder } from "./layout-checks";
import { extractPdfLayout } from "./pdf-layout";
import { computeAtsScore } from "./score";
import type { AtsCheckItem, AtsCheckResult } from "./types";

export type { AtsCheckId, AtsCheckItem, AtsCheckResult, AtsCheckStatus } from "./types";

export async function runAtsChecker(file: File, parsed: ParsedDocument): Promise<AtsCheckResult> {
  const textChecks: AtsCheckItem[] = [
    checkSections(parsed.text),
    checkDatesAndTitles(parsed.text),
    checkContactInfo(parsed.text),
    checkGlyphArtifacts(parsed.text),
    checkDateFormat(parsed.text),
  ];
  const layoutChecks: AtsCheckItem[] = parsed.diagnostics.document_kind === "pdf"
    ? await (async () => {
      const pages = await extractPdfLayout(file);
      return [checkReadingOrder(pages), checkLayoutColumns(pages)];
    })()
    : [{ id: "reading_order", status: "not_applicable" }, { id: "layout_columns", status: "not_applicable" }];
  const checks = [checkTextLayer(parsed.diagnostics), ...layoutChecks, ...textChecks];
  return { score: computeAtsScore(checks), checks };
}
