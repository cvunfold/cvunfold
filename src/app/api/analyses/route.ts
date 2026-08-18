import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createMockReport } from "@/lib/ai/mock-report";
import { validateEvidence, toTeaser } from "@/lib/ai/validate-report";
import { getUnreadableDocumentDiagnostics, parseDocument } from "@/lib/document-parsing";
import { validateCvText } from "@/lib/document-parsing/cv-detection";
import { recordFunnelEvent, saveAnalysisWithRetry } from "@/lib/data/store";
import { createAccessToken, hmacIdentifier } from "@/lib/security/tokens";
import { consumeAnalysisQuota, rateLimit } from "@/lib/security/rate-limit";
import { validateSignature, validateUpload } from "@/lib/security/upload";
import { parseSeniority } from "@/lib/rubrics/technical-v1";
import { parseTargetRoleId } from "@/lib/roles";
import { fallbackModelDisabled, resolveReviewTimeoutMs, reviewWithOpenAI, toSafeOpenAIErrorCode } from "@/lib/ai/openai-review";
import { activePromptVariant } from "@/lib/ai/prompts";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
import { isLocale, reportPath, type Locale } from "@/lib/i18n";
import { marketForLocale, type Plan } from "@/lib/plans";
import { parseAttribution } from "@/lib/analytics/attribution";
import type { ReviewTelemetry } from "@/lib/ai/openai-review";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clickAttributionPresent, DEFAULT_LANDING_VARIANT } from "@/lib/audience";
import { buildSafeAnalysisFailureLog } from "@/lib/observability/analysis-failure";

export const runtime = "nodejs";
// The review call may legitimately run for minutes on a slower model. Without an
// explicit ceiling the platform default can kill the function before the model
// answers, losing a paid generation and reporting a generic failure.
export const maxDuration = 300;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const clientIp = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || "local";
  const ipKey = hmacIdentifier(clientIp);
  const requestedLanguage = request.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "pl";
  let resolvedLocale: Locale = requestedLanguage;
  if (!rateLimit(ipKey)) return NextResponse.json({
    error: requestedLanguage === "en" ? "Too many attempts. Please try again shortly." : "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
    errorCategory: "rate_limit",
  }, { status: 429, headers: { "Retry-After": "60" } });
  try {
    const form = await request.formData();
    const requestedLocale = form.get("locale");
    const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "pl";
    resolvedLocale = locale;
    const market = marketForLocale(locale);
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("MISSING_FILE");
    validateUpload(file);
    const targetRole = parseTargetRoleId(form.get("role") || "frontend_developer");
    if (!targetRole) throw new Error("INVALID_TARGET_ROLE");
    const seniority = parseSeniority(form.get("seniority") || "auto");
    if (!seniority) throw new Error("INVALID_TARGET_SENIORITY");
    const jobDescription = String(form.get("jobDescription") || "").trim();
    const requestedPlan = String(form.get("plan") || "") as Plan | "";
    if (requestedPlan && requestedPlan !== "full_review" && requestedPlan !== "job_match") throw new Error("INVALID_PLAN");
    if (requestedPlan === "job_match" && !jobDescription) throw new Error("MISSING_JOB_DESCRIPTION");
    let rawAttribution: unknown = {};
    try { rawAttribution = JSON.parse(String(form.get("attribution") || "{}")); } catch { rawAttribution = {}; }
    const attribution = parseAttribution({
      ...parseAttribution(rawAttribution),
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: targetRole,
      selected_seniority_enum: seniority,
    });
    const plan: Plan = requestedPlan || (jobDescription ? "job_match" : "full_review");
    const paidClick = clickAttributionPresent(attribution);
    await recordFunnelEvent({
      name: "analysis_started",
      locale,
      market,
      properties: { plan, ...attribution, ...(paidClick ? { paid_click: true } : {}) },
    }).catch(() => undefined);
    await verifyTurnstile(String(form.get("turnstileToken") || ""), clientIp);
    if (jobDescription.length > Number(process.env.MAX_JOB_DESCRIPTION_LENGTH || 20_000)) throw new Error("JOB_DESCRIPTION_TOO_LONG");
    const mockMode = process.env.MOCK_MODE === "true";
    const documentQaMode = mockMode && process.env.NODE_ENV !== "production" && process.env.DOCUMENT_QA_MODE === "true";
    let report;
    let telemetry: ReviewTelemetry = { model: "mock", inputTokens: 0, outputTokens: 0, estimatedCost: 0,
      provenance: { promptVersion: "mock", promptVariant: activePromptVariant(), rubricVersion: "mock", pipelineVersion: REVIEW_PIPELINE_VERSION,
        model: "mock", requestedModel: "mock", fallbackUsed: false,
        modelConfig: { maxOutputTokens: null, timeoutMs: resolveReviewTimeoutMs(), fallbackDisabled: fallbackModelDisabled(), responseFormat: "cv_report", store: false },
        pricing: { inputUsdPerMillion: 0, outputUsdPerMillion: 0, source: "unknown" }, calibrationViolations: [] } };
    if (!mockMode) {
      const quota = await consumeAnalysisQuota(ipKey);
      if (!quota.allowed) return NextResponse.json(
        { error: locale === "en" ? "You have reached the free analysis limit. Please try again later." : "Osiągnięto limit bezpłatnych analiz. Spróbuj ponownie później.", errorCategory: "rate_limit" },
        { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
      );
      await validateSignature(file);
      const parsed = await parseDocument(file);
      validateCvText(parsed.text);
      const review = await reviewWithOpenAI({ segments: parsed.segments, targetRole, targetSeniority: seniority, jobDescription: jobDescription || undefined, locale });
      report = review.report;
      telemetry = review.telemetry;
    } else {
      if (documentQaMode) {
        await validateSignature(file);
        validateCvText((await parseDocument(file)).text);
      }
      const mock = createMockReport(seniority, jobDescription.length > 0, targetRole, locale);
      const mockEvidence = mock.evidenceMap || {};
      report = validateEvidence(mock, new Set(Object.keys(mockEvidence)), mockEvidence, { jobDescriptionProvided: jobDescription.length > 0 });
    }
    const retentionDays = Number(process.env.REPORT_RETENTION_DAYS || 30);
    const { token, analysisId } = await saveAnalysisWithRetry(() => ({
      token: createAccessToken(),
      analysis: { id: randomUUID(), createdAt: new Date(), expiresAt: new Date(Date.now() + retentionDays * 86_400_000),
        status: "complete" as const, paid: false, plan, locale, market, attribution,
        report, feedback: [], durationMs: Date.now() - startedAt, model: telemetry.model, inputTokens: telemetry.inputTokens,
        outputTokens: telemetry.outputTokens, estimatedAiCost: telemetry.estimatedCost, provenance: telemetry.provenance },
    }));
    await Promise.all([
      recordFunnelEvent({ name: "analysis_succeeded", analysisId, locale, market, properties: { plan, ...attribution, analysis_success: true, duration_ms: Date.now() - startedAt, model: telemetry.model, prompt_version: report.promptVersion, rubric_version: report.rubricVersion, input_tokens: telemetry.inputTokens, output_tokens: telemetry.outputTokens, estimated_cost: telemetry.estimatedCost, ...(paidClick ? { paid_click: true } : {}) } }),
    ]).catch(() => undefined);
    return NextResponse.json({ accessToken: token, reportPath: reportPath(locale), teaser: toTeaser(report) });
  } catch (error) {
    const rawCode = toSafeOpenAIErrorCode(error) || (error instanceof Error ? error.message : "ANALYSIS_FAILED");
    const code = error instanceof Error && /timeout/i.test(`${error.name} ${error.message}`) ? "ANALYSIS_TIMEOUT" : rawCode;
    const messages: Record<string, string> = { EMPTY_FILE: "Plik jest pusty.", FILE_TOO_LARGE: "Plik przekracza dozwolony rozmiar.",
      UNSUPPORTED_FILE_TYPE: "Prześlij PDF lub DOCX.", INVALID_FILE_SIGNATURE: "Zawartość pliku nie zgadza się z rozszerzeniem.",
      INVALID_FILE_MIME: "Typ pliku nie zgadza się z rozszerzeniem. Wyeksportuj CV ponownie jako PDF lub DOCX.",
      DOCX_ARCHIVE_UNSAFE: "Ten plik DOCX ma nietypową lub zbyt dużą strukturę. Wyeksportuj go ponownie albo użyj PDF.",
      UNREADABLE_DOCUMENT: "Nie udało się odczytać tekstu. Prześlij tekstowy PDF lub DOCX.", OPENAI_NOT_CONFIGURED: "Analiza AI jest chwilowo niedostępna. Spróbuj ponownie później.",
      OPENAI_AUTH_FAILED: "Analiza AI jest chwilowo niedostępna. Spróbuj ponownie później.",
      OPENAI_RATE_LIMITED: "Analiza AI jest chwilowo przeciążona. Spróbuj ponownie za chwilę.",
      NOT_A_CV: "Ten dokument nie wygląda jak CV. Prześlij dokument zawierający doświadczenie, umiejętności i historię zawodową.",
      INVALID_TARGET_ROLE: "Wybierz rolę z listy.",
      INVALID_TARGET_SENIORITY: "Wybierz obsługiwany poziom seniority.", INVALID_PLAN: "Wybierz obsługiwany wariant raportu.",
      MISSING_JOB_DESCRIPTION: "Wklej treść ogłoszenia, aby dopasować analizę do oferty.",
      DOCUMENT_TEXT_TOO_LONG: "Dokument zawiera zbyt dużo tekstu. Skróć CV do najważniejszych informacji.",
      OPENAI_INVALID_RESPONSE: "Analiza nie przeszła walidacji. Spróbuj ponownie.",
      ANALYSIS_TIMEOUT: "Analiza trwała zbyt długo. Spróbuj ponownie za chwilę.",
      SUPABASE_SAVE_FAILED: "Nie udało się bezpiecznie zapisać raportu. Spróbuj ponownie.",
      TURNSTILE_REQUIRED: "Potwierdź, że analiza nie jest uruchamiana automatycznie.", TURNSTILE_FAILED: "Nie udało się potwierdzić zabezpieczenia. Odśwież stronę i spróbuj ponownie.",
      TURNSTILE_UNAVAILABLE: "Zabezpieczenie przed nadużyciami jest chwilowo niedostępne. Spróbuj ponownie później.",
      INVALID_RUBRIC_WEIGHTS: "Nie udało się przeliczyć oceny raportu. Spróbuj ponownie.",
      RATE_LIMIT_CHECK_FAILED: "Nie możemy teraz bezpiecznie uruchomić analizy. Spróbuj ponownie za chwilę." };
    const safeCode = Object.hasOwn(messages, code) ? code : "ANALYSIS_FAILED";
    const errorCategories: Record<string, string> = {
      EMPTY_FILE: "empty_file", FILE_TOO_LARGE: "file_too_large", UNSUPPORTED_FILE_TYPE: "unsupported_file_type",
      INVALID_FILE_SIGNATURE: "invalid_file_signature", INVALID_FILE_MIME: "invalid_file_mime", DOCX_ARCHIVE_UNSAFE: "unsafe_archive",
      UNREADABLE_DOCUMENT: "unreadable_document", DOCUMENT_TEXT_TOO_LONG: "document_too_long", NOT_A_CV: "not_a_cv",
      INVALID_TARGET_ROLE: "invalid_target_role", INVALID_TARGET_SENIORITY: "invalid_target_seniority", INVALID_PLAN: "invalid_job_description", MISSING_JOB_DESCRIPTION: "invalid_job_description", RATE_LIMIT_CHECK_FAILED: "rate_limit", ANALYSIS_TIMEOUT: "timeout",
      OPENAI_NOT_CONFIGURED: "configuration", OPENAI_AUTH_FAILED: "configuration", OPENAI_RATE_LIMITED: "rate_limit",
      OPENAI_INVALID_RESPONSE: "model", INVALID_RUBRIC_WEIGHTS: "model",
      SUPABASE_SAVE_FAILED: "storage", ANALYSIS_FAILED: "unknown",
      TURNSTILE_REQUIRED: "verification", TURNSTILE_FAILED: "verification", TURNSTILE_UNAVAILABLE: "verification",
    };
    const errorCategory = errorCategories[safeCode] || "unknown";
    // The parser already knows why extraction failed (scan, password, corrupt file, empty
    // document); collapsing all of that into one generic message wastes it.
    const unreadableReason = code === "UNREADABLE_DOCUMENT" ? getUnreadableDocumentDiagnostics(error)?.reason : undefined;
    console.error(JSON.stringify(buildSafeAnalysisFailureLog({
      code: safeCode,
      durationMs: Date.now() - startedAt,
      error,
      requestId: request.headers.get("x-vercel-id"),
    })));
    const status = code === "RATE_LIMIT_CHECK_FAILED" || code === "OPENAI_NOT_CONFIGURED" || code === "OPENAI_AUTH_FAILED" || code === "OPENAI_RATE_LIMITED" ? 503
      : code === "ANALYSIS_TIMEOUT" ? 504
      : code === "OPENAI_INVALID_RESPONSE" || code === "SUPABASE_SAVE_FAILED" || safeCode === "ANALYSIS_FAILED" ? 502
      : 400;
    const locale = resolvedLocale;
    const unreadableReasonMessages: Record<string, { pl: string; en: string }> = {
      pdf_encrypted: {
        pl: "Ten PDF jest zabezpieczony hasłem. Usuń hasło (np. przez wydruk do nowego PDF-a) i prześlij plik ponownie.",
        en: "This PDF is password-protected. Remove the password (for example by printing to a new PDF) and upload it again.",
      },
      pdf_no_text_items: {
        pl: "To wygląda na zeskanowany obraz bez warstwy tekstowej. Wyeksportuj CV jako tekstowy PDF (np. z Worda lub Google Docs) albo prześlij DOCX.",
        en: "This looks like a scanned image with no text layer. Export the CV as a text-based PDF (from Word or Google Docs, for example), or upload a DOCX.",
      },
      pdf_empty_text_items: {
        pl: "To wygląda na zeskanowany obraz bez warstwy tekstowej. Wyeksportuj CV jako tekstowy PDF (np. z Worda lub Google Docs) albo prześlij DOCX.",
        en: "This looks like a scanned image with no text layer. Export the CV as a text-based PDF (from Word or Google Docs, for example), or upload a DOCX.",
      },
      pdf_page_extraction_failed: {
        pl: "Nie udało się odczytać części stron tego PDF-a. Wyeksportuj plik ponownie z programu, w którym powstało CV.",
        en: "We could not read some pages of this PDF. Export the file again from the program that created the CV.",
      },
      pdf_parse_failed: {
        pl: "Ten plik PDF wygląda na uszkodzony lub zapisany w nietypowy sposób. Wyeksportuj go ponownie i spróbuj jeszcze raz.",
        en: "This PDF looks damaged or was saved in an unusual way. Export it again and try once more.",
      },
      docx_no_text: {
        pl: "Nie znaleźliśmy tekstu w tym pliku DOCX. Sprawdź, czy dokument nie jest pusty, albo wyeksportuj CV jako PDF.",
        en: "We found no text in this DOCX file. Check that the document is not empty, or export the CV as a PDF.",
      },
      docx_parse_failed: {
        pl: "Nie udało się otworzyć tego pliku DOCX — może być uszkodzony. Wyeksportuj CV ponownie i spróbuj jeszcze raz.",
        en: "We could not open this DOCX file — it may be damaged. Export the CV again and try once more.",
      },
      text_below_threshold: {
        pl: "Dokument zawiera za mało tekstu do analizy. Sprawdź, czy CV nie jest prawie puste albo czy tekst nie jest zapisany jako obraz.",
        en: "The document contains too little text to analyse. Check that the CV is not nearly empty and that its text is not saved as an image.",
      },
    };
    const reasonMessage = unreadableReason ? unreadableReasonMessages[unreadableReason]?.[locale] : undefined;
    const message = reasonMessage || (locale === "en" ? ({
      EMPTY_FILE: "The file is empty.", FILE_TOO_LARGE: "The file is larger than the allowed limit.", UNSUPPORTED_FILE_TYPE: "Upload a PDF or DOCX file.",
      INVALID_FILE_SIGNATURE: "The file contents do not match its extension.", UNREADABLE_DOCUMENT: "We could not read the text. Upload a text-based PDF or DOCX.",
      INVALID_FILE_MIME: "The file type does not match its extension. Export the CV again as PDF or DOCX.",
      DOCX_ARCHIVE_UNSAFE: "This DOCX has an unusual or excessively large structure. Export it again or use PDF.",
      NOT_A_CV: "This document does not appear to be a CV.", INVALID_TARGET_ROLE: "Choose a role from the list.",
      INVALID_TARGET_SENIORITY: "Choose a supported seniority level.", INVALID_PLAN: "Choose a supported report option.",
      MISSING_JOB_DESCRIPTION: "Paste the job description to match the analysis to this role.",
      RATE_LIMIT_CHECK_FAILED: "We cannot safely start the analysis right now. Try again shortly.",
      DOCUMENT_TEXT_TOO_LONG: "The document contains too much text. Shorten the CV to its most relevant information.",
      OPENAI_NOT_CONFIGURED: "The AI review is temporarily unavailable.", OPENAI_AUTH_FAILED: "The AI review is temporarily unavailable.",
      OPENAI_RATE_LIMITED: "The AI review is temporarily overloaded. Please try again shortly.", OPENAI_INVALID_RESPONSE: "The review did not pass quality validation. Please try again.",
      ANALYSIS_TIMEOUT: "The review took too long. Please try again shortly.", SUPABASE_SAVE_FAILED: "We could not store the report safely. Please try again.",
      TURNSTILE_REQUIRED: "Complete the anti-abuse check.", TURNSTILE_FAILED: "We could not verify the anti-abuse check. Refresh and try again.",
      TURNSTILE_UNAVAILABLE: "The anti-abuse check is temporarily unavailable. Please try again later.",
    } as Record<string, string>)[code] || "We could not analyse the document. Please try again." : messages[code] || "Nie udało się przeanalizować dokumentu.");
    await recordFunnelEvent({
      name: "analysis_failed",
      locale,
      market: marketForLocale(locale),
      properties: { analysis_success: false, error_category: errorCategory, ...(unreadableReason ? { unreadable_reason: unreadableReason } : {}) },
    }).catch(() => undefined);
    return NextResponse.json({ error: message, errorCategory }, { status });
  }
}
