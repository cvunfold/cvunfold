import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createMockReport } from "@/lib/ai/mock-report";
import { validateEvidence, toTeaser } from "@/lib/ai/validate-report";
import { parseDocument } from "@/lib/document-parsing";
import { validateCvText } from "@/lib/document-parsing/cv-detection";
import { saveAnalysis, track } from "@/lib/data/store";
import { createAccessToken, hmacIdentifier } from "@/lib/security/tokens";
import { consumeAnalysisQuota, rateLimit } from "@/lib/security/rate-limit";
import { validateSignature, validateUpload } from "@/lib/security/upload";
import type { Seniority } from "@/lib/rubrics/technical-v1";
import { parseTargetRoleId } from "@/lib/roles";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || "local";
  const ipKey = hmacIdentifier(clientIp);
  if (!rateLimit(ipKey)) return NextResponse.json({ error: "Spróbuj ponownie za chwilę." }, { status: 429 });
  track("analysis_started");
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("MISSING_FILE");
    validateUpload(file);
    const targetRole = parseTargetRoleId(form.get("role") || "frontend_developer");
    if (!targetRole) throw new Error("INVALID_TARGET_ROLE");
    const seniority = String(form.get("seniority") || "auto") as Seniority;
    const jobDescription = String(form.get("jobDescription") || "");
    if (jobDescription.length > Number(process.env.MAX_JOB_DESCRIPTION_LENGTH || 20_000)) throw new Error("JOB_DESCRIPTION_TOO_LONG");
    const mockMode = process.env.MOCK_MODE === "true";
    let report;
    if (!mockMode) {
      const quota = await consumeAnalysisQuota(ipKey);
      if (!quota.allowed) return NextResponse.json(
        { error: "Osiągnięto limit bezpłatnych analiz. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
      );
      await validateSignature(file);
      const parsed = await parseDocument(file);
      validateCvText(parsed.text);
      report = await reviewWithOpenAI({ segments: parsed.segments, targetRole, targetSeniority: seniority, jobDescription: jobDescription || undefined, locale: "pl" });
    } else report = validateEvidence(createMockReport(seniority, jobDescription.length > 0, targetRole), new Set(["seg_exp_1", "seg_summary", "seg_project_1"]));
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
      NOT_A_CV: "Ten dokument nie wygląda jak CV. Prześlij dokument zawierający doświadczenie, umiejętności i historię zawodową.",
      INVALID_TARGET_ROLE: "Wybierz obsługiwaną rolę techniczną.",
      DOCUMENT_TEXT_TOO_LONG: "Dokument zawiera zbyt dużo tekstu. Skróć CV do najważniejszych informacji.",
      OPENAI_INVALID_RESPONSE: "Analiza nie przeszła walidacji. Spróbuj ponownie.",
      INVALID_RUBRIC_WEIGHTS: "Nie udało się przeliczyć oceny raportu. Spróbuj ponownie.",
      RATE_LIMIT_CHECK_FAILED: "Nie możemy teraz bezpiecznie uruchomić analizy. Spróbuj ponownie za chwilę." };
    const safeCode = Object.hasOwn(messages, code) ? code : "ANALYSIS_FAILED";
    console.error(`[analysis_failed] ${safeCode}`);
    const status = code === "RATE_LIMIT_CHECK_FAILED" ? 503 : 400;
    return NextResponse.json({ error: messages[code] || "Nie udało się przeanalizować dokumentu." }, { status });
  }
}
