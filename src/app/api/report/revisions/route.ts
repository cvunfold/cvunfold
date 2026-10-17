import { getTargetRoleOptions, parseTargetRoleId } from "@/lib/roles";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAnalysis, reserveReportRevision, finishReportRevision, releaseReportRevision } from "@/lib/data/store";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { hasReportTestAccess } from "@/lib/security/report-test-access";
import { hasReportCodeAccess } from "@/lib/security/report-access-code";
import { requireSameOrigin } from "@/lib/schools/server";
import { validateUpload, validateSignature } from "@/lib/security/upload";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/tokens";
import { parseDocument } from "@/lib/document-parsing";
import { validateCvText } from "@/lib/document-parsing/cv-detection";
import { runAtsChecker } from "@/lib/ats-checker";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
import { createMockReport } from "@/lib/ai/mock-report";
import { localLiveEvaluationEnabled } from "@/lib/ai/local-live-evaluation";
import { RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";

export const runtime = "nodejs";
export const maxDuration = 300;
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const messages: Record<string, [number, string, string]> = {
  PAYMENT_REQUIRED: [403, "Ponowne sprawdzenia są dostępne po zakupie raportu.", "Rechecks are available after purchasing the report."],
  REPORT_NOT_FOUND: [404, "Raport wygasł lub jest niedostępny.", "The report has expired or is unavailable."],
  LEGACY_REPORT: [409, "Ten starszy raport nie obsługuje ponownych sprawdzeń.", "This older report does not support rechecks."],
  REVISION_BUSY: [409, "Jedno sprawdzenie już trwa. Zaczekaj na wynik.", "A recheck is already running. Wait for the result."],
  REVISION_LIMIT: [409, "Wykorzystano oba ponowne sprawdzenia.", "Both rechecks have been used."],
  CRITERIA_CHANGED: [409, "Kryteria tej starszej analizy uległy zmianie. Nie możemy rzetelnie porównać wyników.", "The criteria for this older analysis have changed, so its scores cannot be compared reliably."],
};

export async function POST(request: Request) {
  let token: string | null = null;
  let leaseId: string | null = null;
  let locale = "pl";
  try {
    requireSameOrigin(request);
    token = reportTokenFromRequest(request);
    const item = token ? await getAnalysis(token) : undefined;
    if (!item || !token) throw new Error("REPORT_NOT_FOUND");
    locale = item.locale;
    const testAccess = hasReportTestAccess(request, token);
    if (!item.paid && !hasReportCodeAccess(item) && !testAccess) throw new Error("PAYMENT_REQUIRED");
    if (item.plan !== "full_review" || item.schoolGroupId) throw new Error("LEGACY_REPORT");
    if ((process.env.MOCK_MODE !== "true" || localLiveEvaluationEnabled()) && item.report.rubricVersion !== RUBRIC_VERSION) throw new Error("CRITERIA_CHANGED");
    if (!rateLimit(`revision:${hashToken(token)}`, 5, 60_000)) throw new Error("REVISION_BUSY");
    const length = Number(request.headers.get("content-length"));
    if (length > Number(process.env.MAX_FILE_SIZE_MB || 8) * 1024 * 1024 + 16_384) throw new Error("FILE_TOO_LARGE");
    const form = await request.formData();
    if (String(form.get("analysisId")) !== item.id) throw new Error("REPORT_NOT_FOUND");
    const requestId = String(form.get("requestId") || "");
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId)) throw new Error("INVALID_REQUEST");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("EMPTY_FILE");
    validateUpload(file);
    await verifyTurnstile(String(form.get("turnstileToken") || ""));
    await validateSignature(file);
    leaseId = randomUUID();
    const reservation = await reserveReportRevision(token, requestId, leaseId, testAccess);
    if (reservation.status === "complete") return NextResponse.json({ ok: true, version: reservation.version }, { headers });
    // Original target and context are authoritative. Client cannot change them.
    const { targetSeniority, careerContext } = item.report.document;
    const targetRole = parseTargetRoleId(item.report.document.targetRole) || getTargetRoleOptions(item.locale).find(role => role.label === item.report.document.targetRole)?.id;
    if (!targetRole) throw new Error("CRITERIA_CHANGED");
    const context = careerContext || (targetSeniority === "first_job" ? "first_job" : "standard");
    let report;
    let provenance = null;
    if (process.env.MOCK_MODE === "true" && !localLiveEvaluationEnabled()) report = createMockReport(targetSeniority, false, targetRole, item.locale, context);
    else {
      const parsed = await parseDocument(file);
      validateCvText(parsed.text);
      const [review, ats] = await Promise.all([
        reviewWithOpenAI({ segments: parsed.segments, targetRole, targetSeniority, careerContext: context, locale: item.locale }),
        runAtsChecker(file, parsed),
      ]);
      report = { ...review.report, ats };
      provenance = review.telemetry.provenance;
    }
    report.document.careerContext = context;
    if (!await finishReportRevision(token, leaseId, report, provenance, testAccess)) throw new Error("REVISION_SAVE_FAILED");
    return NextResponse.json({ ok: true, version: reservation.version }, { headers });
  } catch (error) {
    if (token && leaseId) await releaseReportRevision(token, leaseId).catch(() => undefined);
    const code = error instanceof Error ? error.message : "REVISION_FAILED";
    const known = messages[code];
    const status = known?.[0] || (code === "FILE_TOO_LARGE" || code === "EMPTY_FILE" || code === "INVALID_REQUEST" || code.includes("SIGNATURE") ? 400 : 503);
    const fallback = locale === "en" ? "The recheck could not be completed. No recheck was used. Check the PDF or DOCX and try again." : "Nie udało się ukończyć sprawdzenia. Nie zużyliśmy limitu. Sprawdź plik PDF lub DOCX i spróbuj ponownie.";
    return NextResponse.json({ error: known ? known[locale === "en" ? 2 : 1] : fallback }, { status, headers });
  }
}
