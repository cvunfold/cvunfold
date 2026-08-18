import type { PdfPageLayout, PdfTextItemPosition } from "./types";

type PdfTextItem = { str?: unknown; transform?: unknown; width?: unknown };
type PdfPageData = {
  getTextContent: (options: { normalizeWhitespace: boolean; disableCombineTextItems: boolean }) => Promise<{ items: PdfTextItem[] }>;
};
type PdfDocumentData = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageData>;
  destroy: () => Promise<void> | void;
};
type PdfJsModule = {
  disableWorker: boolean;
  getDocument: (data: Uint8Array) => PromiseLike<PdfDocumentData>;
};

/**
 * A second, independent pass over the same PDF `parseDocument` already read,
 * using the same pinned `pdf.js` build — but keeping each text item's position
 * instead of collapsing it into a single string. Kept separate from
 * `document-parsing/index.ts` so the hardened, tested extraction path there
 * stays untouched; the extra pass costs a few hundred milliseconds on a
 * CV-sized document, not a network call.
 */
export async function extractPdfLayout(file: File, maxPages = Math.max(0, Number(process.env.MAX_PDF_PAGES || 40)) || 40): Promise<PdfPageLayout[]> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const imported = await import("pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js");
  const pdfJs = (imported.default || imported) as PdfJsModule;
  pdfJs.disableWorker = true;
  let document: PdfDocumentData | undefined;
  try {
    document = await pdfJs.getDocument(buffer);
    const pagesToRead = Math.min(document.numPages, maxPages);
    const pages: PdfPageLayout[] = [];
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      try {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
        const items: PdfTextItemPosition[] = content.items.flatMap((item): PdfTextItemPosition[] => {
          const str = typeof item.str === "string" ? item.str : "";
          const transform = Array.isArray(item.transform) ? item.transform : [];
          const x = typeof transform[4] === "number" ? transform[4] : undefined;
          const y = typeof transform[5] === "number" ? transform[5] : undefined;
          if (!str.trim() || x === undefined || y === undefined) return [];
          return [{ str, x, y, width: typeof item.width === "number" ? item.width : str.length * 5 }];
        });
        pages.push({ items });
      } catch {
        pages.push({ items: [] });
      }
    }
    return pages;
  } catch {
    return [];
  } finally {
    if (document) {
      try { await document.destroy(); } catch { /* Cleanup must not replace the layout already extracted. */ }
    }
  }
}
