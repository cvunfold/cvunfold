import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkContactInfo, checkDateFormat, checkDatesAndTitles, checkGlyphArtifacts, checkSections } from "@/lib/ats-checker/text-checks";
import { checkTextLayer } from "@/lib/ats-checker/text-layer";
import { checkLayoutColumns, checkReadingOrder } from "@/lib/ats-checker/layout-checks";
import { computeAtsScore } from "@/lib/ats-checker/score";
import type { PdfPageLayout, PdfTextItemPosition } from "@/lib/ats-checker/types";
import { PII_MASK_TOKENS, maskContactPii } from "@/lib/document-parsing";

const structuredCv = `
  Doświadczenie zawodowe
  Senior Frontend Developer, Lumina Commerce, 2021-01 - obecnie
  Prowadzenie migracji checkoutu do Next.js.

  Umiejętności
  React, TypeScript, Next.js.

  Wykształcenie
  Informatyka, 2015-2019
`;

describe("checkTextLayer", () => {
  it("passes a DOCX unconditionally", () => {
    expect(checkTextLayer({ document_kind: "docx", file_size_bucket: "under_100_kb", parser: "mammoth", extracted_chars: 500, threshold_chars: 120 }))
      .toMatchObject({ status: "pass" });
  });
  it("passes a PDF where every page has text", () => {
    expect(checkTextLayer({ document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse", page_count: 2, pages_with_text: 2, extracted_chars: 500, threshold_chars: 120 }))
      .toMatchObject({ status: "pass" });
  });
  it("warns when some but most pages have text", () => {
    expect(checkTextLayer({ document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse", page_count: 3, pages_with_text: 2, extracted_chars: 500, threshold_chars: 120 }))
      .toMatchObject({ status: "warning" });
  });
  it("fails a mostly-scanned PDF", () => {
    expect(checkTextLayer({ document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse", page_count: 4, pages_with_text: 1, extracted_chars: 500, threshold_chars: 120 }))
      .toMatchObject({ status: "fail" });
  });
});

describe("checkSections", () => {
  it("passes a CV with recognizable experience, skills and education headers", () => {
    expect(checkSections(structuredCv)).toMatchObject({ status: "pass" });
  });
  it("fails text with no recognizable section headers", () => {
    expect(checkSections("Lorem ipsum dolor sit amet consectetur adipiscing elit.")).toMatchObject({ status: "fail" });
  });
});

describe("checkDatesAndTitles", () => {
  it("passes readable date ranges and a job title", () => {
    expect(checkDatesAndTitles(structuredCv)).toMatchObject({ status: "pass" });
  });
  it("fails when neither a date range nor a job title is present", () => {
    expect(checkDatesAndTitles("I like building products people enjoy using every day.")).toMatchObject({ status: "fail" });
  });
});

describe("checkContactInfo", () => {
  it("passes when the email mask token is present", () => {
    expect(checkContactInfo(maskContactPii("Contact: jane.doe@example.com"))).toMatchObject({ status: "pass" });
  });
  it("warns when only a phone token is present", () => {
    expect(checkContactInfo(`Phone: ${PII_MASK_TOKENS.phone}`)).toMatchObject({ status: "warning" });
  });
  it("fails when neither token is present", () => {
    expect(checkContactInfo("No contact details in this document.")).toMatchObject({ status: "fail" });
  });
});

describe("checkGlyphArtifacts", () => {
  it("passes clean text", () => {
    expect(checkGlyphArtifacts(structuredCv)).toMatchObject({ status: "pass" });
  });
  it("fails text containing the Unicode replacement character", () => {
    expect(checkGlyphArtifacts(`Skills�React`)).toMatchObject({ status: "fail" });
  });
  it("warns on icon-font Private Use Area glyphs", () => {
    const padding = "Experience Skills Education ".repeat(3);
    expect(checkGlyphArtifacts(` ${padding}`)).toMatchObject({ status: "warning" });
  });
});

describe("checkDateFormat", () => {
  it("passes unambiguous ISO dates", () => {
    expect(checkDateFormat("Employed 2021-03 to 2023-06.")).toMatchObject({ status: "pass" });
  });
  it("fails a genuinely ambiguous DD/MM vs MM/DD numeric date", () => {
    expect(checkDateFormat("Started on 03/04/2021.")).toMatchObject({ status: "fail" });
  });
  it("warns when three or more distinct date notations are mixed", () => {
    expect(checkDateFormat("From 2021-01, then March 2022, then 06/2023.")).toMatchObject({ status: "warning" });
  });
});

function item(str: string, x: number, y: number): PdfTextItemPosition {
  return { str, x, y, width: str.length * 5 };
}
function singleColumnPage(): PdfPageLayout {
  return { items: [item("Experience", 72, 700), item("Senior Engineer, 2021-2023", 72, 680), item("Skills", 72, 600)] };
}
function twoColumnPage(): PdfPageLayout {
  // Left column read top-to-bottom, then right column top-to-bottom — the
  // single expected jump back up the page for a genuine two-column layout.
  return {
    items: [
      item("Skills", 72, 700), item("React", 72, 680), item("TypeScript", 72, 660),
      item("Experience", 320, 700), item("Senior Engineer", 320, 680), item("2021-2023", 320, 660),
    ],
  };
}
function scrambledPage(): PdfPageLayout {
  return { items: [item("Experience", 72, 700), item("2021-2023", 90, 300), item("Senior Engineer", 72, 680), item("Skills", 72, 400)] };
}

describe("checkLayoutColumns", () => {
  it("passes a single-column page", () => {
    expect(checkLayoutColumns([singleColumnPage()])).toMatchObject({ status: "pass" });
  });
  it("warns on a genuine two-column layout", () => {
    expect(checkLayoutColumns([twoColumnPage()])).toMatchObject({ status: "warning" });
  });
  it("is not_applicable with no items (e.g. a DOCX)", () => {
    expect(checkLayoutColumns([])).toMatchObject({ status: "not_applicable" });
  });
});

describe("checkReadingOrder", () => {
  it("passes a single-column page read top to bottom", () => {
    expect(checkReadingOrder([singleColumnPage()])).toMatchObject({ status: "pass" });
  });
  it("passes the single expected jump of a genuine two-column layout", () => {
    expect(checkReadingOrder([twoColumnPage()])).toMatchObject({ status: "pass" });
  });
  it("flags a page whose text jumps around outside any column pattern", () => {
    const result = checkReadingOrder([scrambledPage()]);
    expect(result.status).not.toBe("pass");
  });
});

describe("computeAtsScore", () => {
  it("scores 100 when every applicable check passes", () => {
    expect(computeAtsScore([{ id: "sections", status: "pass" }, { id: "contact_info", status: "pass" }, { id: "layout_columns", status: "not_applicable" }])).toBe(100);
  });
  it("weighs a warning as half credit", () => {
    expect(computeAtsScore([{ id: "sections", status: "pass" }, { id: "contact_info", status: "warning" }])).toBe(75);
  });
  it("scores 0 when every applicable check fails", () => {
    expect(computeAtsScore([{ id: "sections", status: "fail" }, { id: "contact_info", status: "fail" }])).toBe(0);
  });
});

describe("checker regexes stay stateless across repeated calls", () => {
  it("checkDateFormat gives the same answer twice in a row", () => {
    const text = "Employed 2021-03 to 2023-06.";
    expect(checkDateFormat(text)).toMatchObject({ status: "pass" });
    expect(checkDateFormat(text)).toMatchObject({ status: "pass" });
  });
});

describe("runAtsChecker (PDF layout pass)", () => {
  const { pdfJs } = vi.hoisted(() => ({ pdfJs: { disableWorker: false, getDocument: vi.fn() } }));
  vi.mock("pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js", () => ({ default: pdfJs }));

  beforeEach(() => { pdfJs.getDocument.mockReset(); });

  it("combines text checks with a real PDF layout extraction", async () => {
    const { runAtsChecker } = await import("@/lib/ats-checker");
    pdfJs.getDocument.mockResolvedValue({
      numPages: 1,
      destroy: vi.fn(async () => undefined),
      getPage: vi.fn(async () => ({
        getTextContent: async () => ({
          items: [
            { str: "Doświadczenie zawodowe", transform: [1, 0, 0, 1, 72, 700] },
            { str: "Senior Frontend Developer, 2021-2023", transform: [1, 0, 0, 1, 72, 680] },
          ],
        }),
      })),
    });
    const file = new File([Buffer.from("%PDF-1.7\nsynthetic")], "cv.pdf", { type: "application/pdf" });
    const parsed = {
      text: structuredCv,
      segments: [],
      quality: "good" as const,
      diagnostics: { document_kind: "pdf" as const, file_size_bucket: "under_100_kb" as const, parser: "pdf-parse" as const, page_count: 1, pages_with_text: 1, extracted_chars: structuredCv.length, threshold_chars: 120 },
    };
    const result = await runAtsChecker(file, parsed);
    expect(result.checks).toHaveLength(8);
    expect(result.score).toBeGreaterThan(0);
    expect(result.checks.find((check) => check.id === "reading_order")?.status).toBe("pass");
  });
});
