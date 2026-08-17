import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnreadableDocumentError } from "@/lib/document-parsing";

const { parseDocument } = vi.hoisted(() => ({ parseDocument: vi.fn() }));
vi.mock("@/lib/document-parsing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/document-parsing")>();
  return { ...actual, parseDocument };
});

import { POST as createAnalysis } from "@/app/api/analyses/route";

function requestWithIp(ip: string) {
  const form = new FormData();
  form.set("file", new File(["%PDF-1.7\nsynthetic"], "synthetic-cv.pdf", { type: "application/pdf" }));
  form.set("role", "frontend_developer");
  form.set("seniority", "auto");
  form.set("locale", "pl");
  form.set("attribution", "{}");
  return new Request("http://localhost/api/analyses", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  });
}

beforeEach(() => {
  process.env.MOCK_MODE = "true";
  process.env.DOCUMENT_QA_MODE = "true";
  delete process.env.TURNSTILE_SECRET_KEY;
  parseDocument.mockReset();
});
afterEach(() => {
  delete process.env.MOCK_MODE;
  delete process.env.DOCUMENT_QA_MODE;
});

// A scan and a password-locked file both fail extraction, but they need different guidance —
// this is the failure class behind three "storage"-adjacent reports the founder could not
// otherwise tell apart.
describe("unreadable document guidance", () => {
  it("tells a reader with a scanned PDF to export text, not just 'we could not read the text'", async () => {
    parseDocument.mockRejectedValue(new UnreadableDocumentError({
      document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse",
      extracted_chars: 0, threshold_chars: 120, reason: "pdf_no_text_items",
    }));
    const response = await createAnalysis(requestWithIp("127.0.10.1"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errorCategory).toBe("unreadable_document");
    expect(body.error).toMatch(/zeskanowany obraz/);
  });

  it("tells a reader with a password-protected PDF to remove the password", async () => {
    parseDocument.mockRejectedValue(new UnreadableDocumentError({
      document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse",
      extracted_chars: 0, threshold_chars: 120, reason: "pdf_encrypted",
    }));
    const response = await createAnalysis(requestWithIp("127.0.10.2"));
    const body = await response.json();
    expect(body.error).toMatch(/hasłem/);
  });

  it("gives a distinct message for a damaged DOCX", async () => {
    parseDocument.mockRejectedValue(new UnreadableDocumentError({
      document_kind: "docx", file_size_bucket: "under_100_kb", parser: "mammoth",
      extracted_chars: 0, threshold_chars: 120, reason: "docx_parse_failed",
    }));
    const response = await createAnalysis(requestWithIp("127.0.10.3"));
    const body = await response.json();
    expect(body.error).toMatch(/uszkodzony/);
  });

  it("gives the English reader the same reason-specific guidance", async () => {
    parseDocument.mockRejectedValue(new UnreadableDocumentError({
      document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse",
      extracted_chars: 0, threshold_chars: 120, reason: "pdf_page_extraction_failed",
    }));
    const form = new FormData();
    form.set("file", new File(["%PDF-1.7\nsynthetic"], "synthetic-cv.pdf", { type: "application/pdf" }));
    form.set("role", "frontend_developer");
    form.set("seniority", "auto");
    form.set("locale", "en");
    form.set("attribution", "{}");
    const response = await createAnalysis(new Request("http://localhost/api/analyses", {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.10.5" },
      body: form,
    }));
    expect((await response.json()).error).toMatch(/some pages/);
  });

  it("falls back to the generic message for an error code with no specific mapping", async () => {
    parseDocument.mockRejectedValue(new Error("SOME_UNMAPPED_ERROR"));
    const response = await createAnalysis(requestWithIp("127.0.10.6"));
    const body = await response.json();
    expect(body.errorCategory).toBe("unknown");
    expect(body.error).toBe("Nie udało się przeanalizować dokumentu.");
  });
});
