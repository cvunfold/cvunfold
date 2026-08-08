import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createMockReport } from "@/lib/ai/mock-report";
import { validateEvidence, toTeaser } from "@/lib/ai/validate-report";
import { parseDocument } from "@/lib/document-parsing";
import { saveAnalysis, track } from "@/lib/data/store";
import { createAccessToken, hmacIdentifier } from "@/lib/security/tokens";
import { rateLimit } from "@/lib/security/rate-limit";
import { validateSignature, validateUpload } from "@/lib/security/upload";
import type { Seniority } from "@/lib/rubrics/frontend-v1";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ipKey = hmacIdentifier(request.headers.get("x-forwarded-for")?.split(",")[0] || "local");
  if (!rateLimit(ipKey)) return NextResponse.json({ error: "Spróbuj ponownie za chwilę." }, { status: 429 });
  track("analysis_started");
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("MISSING_FILE");
    validateUpload(file);
    const seniority = String(form.get("seniority") || "auto") as Seniority;
    const jobDescription = String(form.get("jobDescription") || "");
    if (jobDescription.length > Number(process.env.MAX_JOB_DESCRIPTION_LENGTH || 20_000)) throw new Error("JOB_DESCRIPTION_TOO_LONG");
    const mockMode = process.env.MOCK_MODE === "true";
    let report;
    if (!mockMode) {
      await validateSignature(file);
      const parsed = await parseDocument(file);
      report = await reviewWithOpenAI({ segments: parsed.segments, targetSeniority: seniority, jobDescription: jobDescription || undefined, locale: "pl" });
    } else report = validateEvidence(createMockReport(seniority, jobDescription.length > 0), new Set(["seg_exp_1", "seg_summary", "seg_project_1"]));
    const token = createAccessToken();
    const retentionDays = Number(process.env.REPORT_RETENTION_DAYS || 30);
    await saveAnalysis(token, { id: randomUUID(), createdAt: new Date(), expiresAt: new Date(Date.now() + retentionDays * 86_400_000),
      status: "complete", paid: false, plan: jobDescription ? "job_match" : "full_review", report, feedback: [] });
    track("analysis_succeeded"); track("teaser_viewed");
    return NextResponse.json({ accessToken: token, teaser: toTeaser(report) });
  } catch (error) {
    track("analysis_failed");
    const code = error instanceof Error ? error.message : "ANALYSIS_FAILED";
    const messages: Record<string, string> = { EMPTY_FILE: "Plik jest pusty.", FILE_TOO_LARGE: "Plik przekracza dozwolony rozmiar.",
      UNSUPPORTED_FILE_TYPE: "Prześlij PDF lub DOCX.", INVALID_FILE_SIGNATURE: "Zawartość pliku nie zgadza się z rozszerzeniem.",
      UNREADABLE_DOCUMENT: "Nie udało się odczytać tekstu. Prześlij tekstowy PDF lub DOCX.", OPENAI_NOT_CONFIGURED: "Integracja AI nie jest jeszcze skonfigurowana.",
      OPENAI_INVALID_RESPONSE: "Analiza nie przeszła walidacji. Spróbuj ponownie." };
    return NextResponse.json({ error: messages[code] || "Nie udało się przeanalizować dokumentu." }, { status: 400 });
  }
}
