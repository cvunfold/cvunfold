import mammoth from "mammoth";

export type Segment = { id: string; text: string };
export type ParsedDocument = {
  text: string;
  segments: Segment[];
  quality: "good" | "degraded";
  /** Same shape the module already builds for `UnreadableDocumentError`, also attached on success so downstream checks (e.g. the ATS checker) can read it without re-parsing. */
  diagnostics: Omit<DocumentExtractionDiagnostics, "reason">;
};
export type UnreadableDocumentReason =
  | "pdf_no_text_items"
  | "pdf_empty_text_items"
  | "pdf_page_extraction_failed"
  | "pdf_parse_failed"
  | "pdf_encrypted"
  | "docx_no_text"
  | "docx_parse_failed"
  | "text_below_threshold";
export type DocumentExtractionDiagnostics = {
  document_kind: "pdf" | "docx";
  file_size_bucket: "under_100_kb" | "100_kb_to_1_mb" | "1_mb_to_5_mb" | "over_5_mb";
  parser: "pdf-parse" | "mammoth";
  parser_version?: string;
  page_count?: number;
  pages_attempted?: number;
  pages_processed?: number;
  pages_with_text?: number;
  text_item_count?: number;
  page_extraction_failures?: number;
  parser_warning_count?: number;
  extracted_chars: number;
  threshold_chars: number;
  reason: UnreadableDocumentReason;
};

export class UnreadableDocumentError extends Error {
  constructor(readonly diagnostics: DocumentExtractionDiagnostics) {
    super("UNREADABLE_DOCUMENT");
    this.name = "UnreadableDocumentError";
  }
}

export function getUnreadableDocumentDiagnostics(error: unknown): DocumentExtractionDiagnostics | undefined {
  return error instanceof UnreadableDocumentError ? error.diagnostics : undefined;
}

type PdfTextItem = { str?: unknown; transform?: unknown };
type PdfPageData = {
  getTextContent: (options: { normalizeWhitespace: boolean; disableCombineTextItems: boolean }) => Promise<{ items: PdfTextItem[] }>;
};
type PdfDocumentData = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageData>;
  destroy: () => Promise<void> | void;
};
type PdfJsModule = {
  version: string;
  disableWorker: boolean;
  getDocument: (data: Uint8Array) => PromiseLike<PdfDocumentData>;
};

const minimumTextChars = 120;
const bundledPdfJsVersion = "v2.0.550";

const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phone = /(?<!\d)(?:\+?48[ -]?)?(?:\d[ -]?){9}(?!\d)/g;
const address = /\b(?:ul\.|aleja|al\.|os\.)\s+[^\n,]{3,40}(?:,\s*\d{2}-\d{3}\s+[^\n]+)?/gi;
const protectedTraitLabel = /(?<![\p{L}])(?:age|date of birth|gender|sex|nationality|citizenship|marital[ -]status|family[ -]status|wiek|data urodzenia|płeć|narodowość|obywatelstwo|stan cywilny)(?![\p{L}])/giu;

/** The literal replacement tokens `maskContactPii` leaves behind. A downstream check can look for these instead of re-matching raw PII. */
export const PII_MASK_TOKENS = { email: "[EMAIL UKRYTY]", phone: "[TELEFON UKRYTY]", address: "[ADRES UKRYTY]" } as const;

export function maskContactPii(text: string): string {
  return text.replace(email, PII_MASK_TOKENS.email).replace(phone, PII_MASK_TOKENS.phone).replace(address, PII_MASK_TOKENS.address);
}

function containsProtectedPersonalData(text: string): boolean {
  const matches = text.match(protectedTraitLabel) || [];
  if (new Set(matches.map((value) => value.toLocaleLowerCase("en"))).size >= 2) return true;
  return /(?<![\p{L}])(?:age|date of birth|gender|sex|nationality|citizenship|marital[ -]status|family[ -]status|wiek|data urodzenia|płeć|narodowość|obywatelstwo|stan cywilny)(?![\p{L}])\s*(?::|[-–—]|\d)/iu.test(text);
}

function looksLikePromptInjection(text: string): boolean {
  return /(?:ignore previous instructions|give (?:a )?score(?: of)? \d+|reveal (?:the )?(?:system prompt|secrets)|environment variables|open https?:\/\/|zignoruj poprzednie instrukcje|przyznaj \d+ punktów|ujawnij (?:prompt systemowy|sekrety)|zmienne środowiskowe|otwórz https?:\/\/)/i.test(text);
}

// The PDF renderer emits a single newline per visual line, so splitting on blank
// lines alone keeps a whole bullet list inside one segment. The sentence rule
// cannot recover it either: after a bullet's closing period the next character is
// the marker, not a capital. A bullet marker is the reliable boundary in a CV, so
// treat it as one and strip it from the quoted evidence.
const SEGMENT_BOUNDARY = /\n{2,}|\n(?=[ \t]*(?:[•·▪◦‣∙]|[-*–—][ \t]))|(?<=\.)\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/;
const BULLET_PREFIX = /^\s*(?:[•·▪◦‣∙]+|[-*–—](?=\s))\s*/;

export function createSegments(text: string): Segment[] {
  return text.split(SEGMENT_BOUNDARY)
    // A segment still wraps across visual lines, so collapse those breaks to keep
    // the quoted evidence readable instead of reproducing the PDF's line layout.
    .map((part) => part.replace(BULLET_PREFIX, "").replace(/\s+/g, " ").trim())
    .filter((part) => Boolean(part) && !containsProtectedPersonalData(part) && !looksLikePromptInjection(part))
    .slice(0, 200).map((part, index) => ({ id: `seg_${index.toString(36)}`, text: part }));
}

function fileSizeBucket(bytes: number): DocumentExtractionDiagnostics["file_size_bucket"] {
  if (bytes < 100 * 1024) return "under_100_kb";
  if (bytes < 1024 * 1024) return "100_kb_to_1_mb";
  if (bytes < 5 * 1024 * 1024) return "1_mb_to_5_mb";
  return "over_5_mb";
}

function pdfPageRenderer(counters: {
  pagesProcessed: number;
  pagesWithText: number;
  textItemCount: number;
  pageExtractionFailures: number;
}) {
  return async (pageData: PdfPageData): Promise<string> => {
    counters.pagesProcessed += 1;
    try {
      const textContent = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      counters.textItemCount += textContent.items.length;
      let lastY: number | undefined;
      let text = "";
      for (const item of textContent.items) {
        const value = typeof item.str === "string" ? item.str : "";
        const transform = Array.isArray(item.transform) ? item.transform : [];
        const y = typeof transform[5] === "number" ? transform[5] : undefined;
        text += lastY === undefined || y === undefined || lastY === y ? value : `\n${value}`;
        lastY = y;
      }
      if (text.trim()) counters.pagesWithText += 1;
      return text;
    } catch {
      counters.pageExtractionFailures += 1;
      return "";
    }
  };
}

function unreadableReason(
  documentKind: "pdf" | "docx",
  extractedChars: number,
  pdfCounters?: { textItemCount: number; pageExtractionFailures: number },
): UnreadableDocumentReason {
  if (documentKind === "docx" && extractedChars === 0) return "docx_no_text";
  if (documentKind === "pdf" && pdfCounters?.pageExtractionFailures) return "pdf_page_extraction_failed";
  if (documentKind === "pdf" && pdfCounters?.textItemCount === 0) return "pdf_no_text_items";
  if (documentKind === "pdf" && extractedChars === 0) return "pdf_empty_text_items";
  return "text_below_threshold";
}

function looksLikeEncryptedPdf(buffer: Buffer): boolean {
  return buffer.includes(Buffer.from("/Encrypt", "ascii"));
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = "";
  let diagnostics: Omit<DocumentExtractionDiagnostics, "extracted_chars" | "threshold_chars" | "reason">;
  let pdfCounters: { pagesProcessed: number; pagesWithText: number; textItemCount: number; pageExtractionFailures: number } | undefined;
  if (name.endsWith(".docx")) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      diagnostics = {
        document_kind: "docx",
        file_size_bucket: fileSizeBucket(buffer.byteLength),
        parser: "mammoth",
        parser_warning_count: result.messages.length,
      };
    } catch {
      throw new UnreadableDocumentError({
        document_kind: "docx",
        file_size_bucket: fileSizeBucket(buffer.byteLength),
        parser: "mammoth",
        extracted_chars: 0,
        threshold_chars: minimumTextChars,
        reason: "docx_parse_failed",
      });
    }
  }
  else if (name.endsWith(".pdf")) {
    pdfCounters = { pagesProcessed: 0, pagesWithText: 0, textItemCount: 0, pageExtractionFailures: 0 };
    let document: PdfDocumentData | undefined;
    try {
      const imported = await import("pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js");
      const pdfJs = (imported.default || imported) as PdfJsModule;
      pdfJs.disableWorker = true;
      document = await pdfJs.getDocument(new Uint8Array(buffer));
      const pagesAttempted = Math.min(document.numPages, Math.max(0, Number(process.env.MAX_PDF_PAGES || 40)) || document.numPages);
      const renderPage = pdfPageRenderer(pdfCounters);
      for (let pageNumber = 1; pageNumber <= pagesAttempted; pageNumber += 1) {
        try {
          const page = await document.getPage(pageNumber);
          text += `\n\n${await renderPage(page)}`;
        } catch {
          pdfCounters.pageExtractionFailures += 1;
        }
      }
      diagnostics = {
        document_kind: "pdf",
        file_size_bucket: fileSizeBucket(buffer.byteLength),
        parser: "pdf-parse",
        parser_version: `v${pdfJs.version}`,
        page_count: document.numPages,
        pages_attempted: pagesAttempted,
        pages_processed: pdfCounters.pagesProcessed,
        pages_with_text: pdfCounters.pagesWithText,
        text_item_count: pdfCounters.textItemCount,
        page_extraction_failures: pdfCounters.pageExtractionFailures,
      };
    } catch {
      throw new UnreadableDocumentError({
        document_kind: "pdf",
        file_size_bucket: fileSizeBucket(buffer.byteLength),
        parser: "pdf-parse",
        parser_version: bundledPdfJsVersion,
        pages_processed: pdfCounters.pagesProcessed,
        pages_with_text: pdfCounters.pagesWithText,
        text_item_count: pdfCounters.textItemCount,
        page_extraction_failures: pdfCounters.pageExtractionFailures,
        extracted_chars: 0,
        threshold_chars: minimumTextChars,
        reason: looksLikeEncryptedPdf(buffer) ? "pdf_encrypted" : "pdf_parse_failed",
      });
    } finally {
      if (document) {
        try { await document.destroy(); } catch { /* Cleanup must not replace the safe extraction result. */ }
      }
    }
  } else throw new Error("UNSUPPORTED_FILE_TYPE");
  text = maskContactPii(text).replace(/\0/g, "").trim();
  if (text.length < minimumTextChars) throw new UnreadableDocumentError({
    ...diagnostics,
    extracted_chars: text.length,
    threshold_chars: minimumTextChars,
    reason: unreadableReason(diagnostics.document_kind, text.length, pdfCounters),
  });
  return {
    text, segments: createSegments(text), quality: text.length < 500 ? "degraded" : "good",
    diagnostics: { ...diagnostics, extracted_chars: text.length, threshold_chars: minimumTextChars },
  };
}
