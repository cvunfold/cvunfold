import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// parseDocument resolves with real, un-CV-shaped text so the real detectLikelyCv/validateCvText
// heuristic runs end to end — the diagnostics this test checks come from that real classification,
// not from a mocked NotACvError.
const { parseDocument } = vi.hoisted(() => ({ parseDocument: vi.fn() }));
vi.mock("@/lib/document-parsing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/document-parsing")>();
  return { ...actual, parseDocument };
});

const { recordFunnelEvent } = vi.hoisted(() => ({ recordFunnelEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/data/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/store")>();
  return { ...actual, recordFunnelEvent };
});

import { POST as createAnalysis } from "@/app/api/analyses/route";

function requestWithIp(ip: string, text: string) {
  const form = new FormData();
  form.set("file", new File(["%PDF-1.7\nsynthetic"], "synthetic-cv.pdf", { type: "application/pdf" }));
  form.set("role", "frontend_developer");
  form.set("seniority", "auto");
  form.set("locale", "pl");
  form.set("attribution", "{}");
  // diagnostics is required on ParsedDocument and is read on the success path, so a
  // mock without it throws a TypeError and turns a clean 400 into a 502.
  parseDocument.mockResolvedValue({
    text,
    segments: [{ id: "seg_1", text }],
    quality: "good",
    diagnostics: { document_kind: "pdf", file_size_bucket: "under_100_kb", parser: "pdf-parse", extracted_chars: text.length, threshold_chars: 0 },
  });
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
  recordFunnelEvent.mockClear();
});
afterEach(() => {
  delete process.env.MOCK_MODE;
  delete process.env.DOCUMENT_QA_MODE;
});

// Which gate rejected the document (too short, no career anchor, thin structure, or a score
// that just missed) used to be computed and immediately discarded — this is the wiring that
// keeps it, so a founder can tell a false positive from a genuine non-CV upload.
describe("not-a-CV rejection diagnostics", () => {
  it("reports the rejection reason for a too-short document", async () => {
    const response = await createAnalysis(requestWithIp("127.0.11.1", "Za krótki dokument."));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errorCategory).toBe("not_a_cv");

    const call = recordFunnelEvent.mock.calls.find(([event]) => event.name === "analysis_failed");
    expect(call?.[0].properties).toMatchObject({ error_category: "not_a_cv", not_a_cv_reason: "too_short" });
  });

  it("reports a distinct reason for structure without a career anchor", async () => {
    const text = `
      Wykształcenie: Politechnika Warszawska, kierunek Informatyka.
      Umiejętności: znajomość języków programowania, pracy zespołowej oraz metodyk zwinnych.
      Języki obce: angielski na poziomie zaawansowanym, niemiecki na poziomie podstawowym.
    `;
    const response = await createAnalysis(requestWithIp("127.0.11.2", text));
    const body = await response.json();
    expect(body.errorCategory).toBe("not_a_cv");

    const call = recordFunnelEvent.mock.calls.find(([event]) => event.name === "analysis_failed");
    expect(call?.[0].properties).toMatchObject({ not_a_cv_reason: "no_career_anchor" });
  });

  it("never puts document content in the logged properties", async () => {
    await createAnalysis(requestWithIp("127.0.11.3", "Za krótki dokument."));
    const call = recordFunnelEvent.mock.calls.find(([event]) => event.name === "analysis_failed");
    expect(JSON.stringify(call?.[0].properties)).not.toContain("krótki");
  });
});
