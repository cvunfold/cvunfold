import { beforeEach, describe, expect, it, vi } from "vitest";

const { extractRawText, pdfJs } = vi.hoisted(() => ({
  extractRawText: vi.fn(),
  pdfJs: { version: "2.0.550", disableWorker: false, getDocument: vi.fn() },
}));

vi.mock("mammoth", () => ({ default: { extractRawText } }));
vi.mock("pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js", () => ({ default: pdfJs }));

import {
  getUnreadableDocumentDiagnostics,
  parseDocument,
  UnreadableDocumentError,
} from "@/lib/document-parsing";

type TestPdfPage = { getTextContent: () => Promise<{ items: Array<{ str: string; transform: number[] }> }> };

function pdfFile(): File {
  return new File([Buffer.from("%PDF-1.7\nsynthetic")], "synthetic.pdf", { type: "application/pdf" });
}

function configurePdf(pages: TestPdfPage[]) {
  pdfJs.getDocument.mockResolvedValue({
    numPages: pages.length,
    getPage: vi.fn(async (pageNumber: number) => pages[pageNumber - 1]),
    destroy: vi.fn(async () => undefined),
  });
}

async function unreadableDiagnostics(file: File) {
  try {
    await parseDocument(file);
    throw new Error("Expected parseDocument to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(UnreadableDocumentError);
    return getUnreadableDocumentDiagnostics(error);
  }
}

beforeEach(() => {
  extractRawText.mockReset();
  pdfJs.getDocument.mockReset();
});

describe("privacy-safe document extraction diagnostics", () => {
  it("distinguishes a PDF with no extractable text items", async () => {
    configurePdf([{ getTextContent: async () => ({ items: [] }) }]);
    await expect(unreadableDiagnostics(pdfFile())).resolves.toMatchObject({
      document_kind: "pdf",
      parser: "pdf-parse",
      parser_version: "v2.0.550",
      page_count: 1,
      pages_with_text: 0,
      text_item_count: 0,
      page_extraction_failures: 0,
      extracted_chars: 0,
      threshold_chars: 120,
      reason: "pdf_no_text_items",
    });
  });

  it("distinguishes a PDF page extraction failure", async () => {
    configurePdf([{ getTextContent: async () => { throw new Error("parser failed"); } }]);
    await expect(unreadableDiagnostics(pdfFile())).resolves.toMatchObject({
      page_count: 1,
      pages_processed: 1,
      page_extraction_failures: 1,
      reason: "pdf_page_extraction_failed",
    });
  });

  it("records only a DOCX warning count when no text is extracted", async () => {
    extractRawText.mockResolvedValue({ value: "", messages: [{ type: "warning", message: "private parser detail" }] });
    const file = new File([Buffer.from("PK\u0003\u0004synthetic")], "synthetic.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const diagnostics = await unreadableDiagnostics(file);
    expect(diagnostics).toMatchObject({
      document_kind: "docx",
      parser: "mammoth",
      parser_warning_count: 1,
      extracted_chars: 0,
      reason: "docx_no_text",
    });
    expect(JSON.stringify(diagnostics)).not.toContain("private parser detail");
  });

  it("continues to parse a text PDF without retaining its contents in diagnostics", async () => {
    configurePdf([{ getTextContent: async () => ({ items: [{ str: "A".repeat(600), transform: [1, 0, 0, 1, 0, 100] }] }) }]);
    const parsed = await parseDocument(pdfFile());
    expect(parsed).toMatchObject({ quality: "good" });
    expect(parsed.text).toHaveLength(600);
  });

  it("destroys one PDF before parsing the next document", async () => {
    let firstDestroyed = false;
    pdfJs.getDocument
      .mockResolvedValueOnce({
        numPages: 1,
        getPage: async () => ({ getTextContent: async () => ({ items: [{ str: "A".repeat(600), transform: [1, 0, 0, 1, 0, 100] }] }) }),
        destroy: async () => { firstDestroyed = true; },
      })
      .mockImplementationOnce(async () => {
        expect(firstDestroyed).toBe(true);
        return {
          numPages: 1,
          getPage: async () => ({ getTextContent: async () => ({ items: [{ str: "B".repeat(700), transform: [1, 0, 0, 1, 0, 100] }] }) }),
          destroy: async () => undefined,
        };
      });
    const first = await parseDocument(pdfFile());
    const second = await parseDocument(pdfFile());
    expect([first.text.length, second.text.length]).toEqual([600, 700]);
  });

  it("turns a DOCX parser exception into a closed privacy-safe reason", async () => {
    extractRawText.mockRejectedValue(new Error("private malformed XML detail"));
    const file = new File([Buffer.from("PK\u0003\u0004synthetic")], "synthetic.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const diagnostics = await unreadableDiagnostics(file);
    expect(diagnostics).toMatchObject({
      document_kind: "docx",
      extracted_chars: 0,
      reason: "docx_parse_failed",
    });
    expect(JSON.stringify(diagnostics)).not.toContain("private malformed XML detail");
  });

  it("turns a PDF parser exception into a closed privacy-safe reason", async () => {
    pdfJs.getDocument.mockRejectedValue(new Error("private xref detail"));
    const diagnostics = await unreadableDiagnostics(pdfFile());
    expect(diagnostics).toMatchObject({
      document_kind: "pdf",
      parser_version: "v2.0.550",
      extracted_chars: 0,
      reason: "pdf_parse_failed",
    });
    expect(JSON.stringify(diagnostics)).not.toContain("private xref detail");
  });

  it("distinguishes an encrypted PDF without logging its parser exception", async () => {
    pdfJs.getDocument.mockRejectedValue(new Error("private password detail"));
    const file = new File([Buffer.from("%PDF-1.7\n/Encrypt 4 0 R")], "encrypted.pdf", { type: "application/pdf" });
    await expect(unreadableDiagnostics(file)).resolves.toMatchObject({ reason: "pdf_encrypted" });
  });
});
