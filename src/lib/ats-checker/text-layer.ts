import type { DocumentExtractionDiagnostics } from "@/lib/document-parsing";
import type { AtsCheckItem } from "./types";

/** DOCX text always comes from a real text layer (mammoth reads the document's XML), so the question does not apply — it is trivially satisfied. */
export function checkTextLayer(diagnostics: Omit<DocumentExtractionDiagnostics, "reason">): AtsCheckItem {
  if (diagnostics.document_kind === "docx") return { id: "text_layer", status: "pass" };
  const pageCount = diagnostics.page_count ?? 0;
  const pagesWithText = diagnostics.pages_with_text ?? 0;
  const ratio = pageCount > 0 ? pagesWithText / pageCount : 0;
  const metrics = { page_count: pageCount, pages_with_text: pagesWithText };
  if (ratio >= 1) return { id: "text_layer", status: "pass", metrics };
  if (ratio >= 0.5) return { id: "text_layer", status: "warning", metrics };
  return { id: "text_layer", status: "fail", metrics };
}
