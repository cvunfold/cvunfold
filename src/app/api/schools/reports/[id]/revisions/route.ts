import { hasSchoolReportAccess } from "@/lib/schools/access-policy";
import type { CVReport } from "@/lib/ai/schemas/report";
import type { SchoolContact } from "@/lib/schools/contact";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizedSchoolAnalysis } from "@/lib/schools/data";
import { schoolReviewCriteria, assertSchoolCriteriaCurrent, reserveSchoolRevision, completeSchoolRevision, releaseSchoolRevision } from "@/lib/schools/revisions";
import { readSchoolPackage } from "@/lib/schools/package";
import { hasSchoolTestAccess } from "@/lib/schools/test-access";
import { privateHeaders, requireSameOrigin, SchoolError, schoolFailure } from "@/lib/schools/server";
import { validateUpload, validateSignature } from "@/lib/security/upload";
import { consumeAnalysisQuota, rateLimit } from "@/lib/security/rate-limit";
import { hmacIdentifier } from "@/lib/security/tokens";
import { parseDocument } from "@/lib/document-parsing";
import { validateCvText } from "@/lib/document-parsing/cv-detection";
import { runAtsChecker } from "@/lib/ats-checker";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
import { createMockReport } from "@/lib/ai/mock-report";
import { localLiveEvaluationEnabled } from "@/lib/ai/local-live-evaluation";
export const runtime = "nodejs";
export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  let reserved: { id: string; schoolId: string; leaseId: string } | null = null;
  try {
    requireSameOrigin(request);
    const id = (await context.params).id;
    const { analysis: item, member, groupId } = await authorizedSchoolAnalysis(request, id);
    const testAccess = hasSchoolTestAccess(request, member, groupId);
    const entitlement = await readSchoolPackage(groupId);
    if (!hasSchoolReportAccess(item.paid, entitlement, testAccess)) throw new SchoolError(403, "Odblokuj raport lub pakiet grupy przed ponowną analizą.");
    assertSchoolCriteriaCurrent(item);
    const key = hmacIdentifier(`school-analysis:${member.schoolId}`);
    if (!rateLimit(`school-revision:${id}`, 5, 60_000)) throw new SchoolError(429, "Zbyt wiele prób. Zaczekaj chwilę.");
    if (Number(request.headers.get("content-length")) > 8 * 1024 * 1024 + 16384) throw new SchoolError(413, "Plik jest za duży.");
    const form = await request.formData();
    if (form.get("schoolConsent") !== "true") throw new SchoolError(400, "Potwierdź prawo do przetwarzania poprawionego CV.");
    const requestId = String(form.get("requestId") || "");
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId)) throw new SchoolError(400, "Odśwież formularz i spróbuj ponownie.");
    const file = form.get("file");
    if (!(file instanceof File)) throw new SchoolError(400, "Wybierz poprawione CV.");
    validateUpload(file); await validateSignature(file);
    const leaseId = randomUUID();
    const reservation = await reserveSchoolRevision(id, member.schoolId, requestId, leaseId, testAccess);
    if (reservation.status === "complete") return NextResponse.json({ ok: true, version: reservation.version }, { headers: privateHeaders });
    reserved = { id, schoolId: member.schoolId, leaseId };
    const { role, stage, context: careerContext } = schoolReviewCriteria(item);
    let report: CVReport & { schoolContact?: SchoolContact }; let provenance = null;
    if (process.env.MOCK_MODE === "true" && !localLiveEvaluationEnabled() && process.env.NODE_ENV !== "production") {
      report = { ...createMockReport(stage, false, role, item.locale, careerContext), schoolContact: (item.report as CVReport & { schoolContact?: SchoolContact }).schoolContact };
    } else {
      const quota = await consumeAnalysisQuota(key, 60, 120);
      if (!quota.allowed) throw new SchoolError(429, "Osiągnięto limit analiz szkoły. Spróbuj później.");
      const parsed = await parseDocument(file, { includeContact: true }); validateCvText(parsed.text);
      const [review, ats] = await Promise.all([reviewWithOpenAI({ segments: parsed.segments, targetRole: role, targetSeniority: stage, careerContext, locale: item.locale }), runAtsChecker(file, parsed)]);
      report = { ...review.report, ats, schoolContact: parsed.sourceContact };
      provenance = review.telemetry.provenance;
      // A fallback or configuration change cannot silently masquerade as progress.
      if (report.promptVersion !== item.report.promptVersion || report.rubricVersion !== item.report.rubricVersion || provenance.model !== item.provenance?.model || provenance.pipelineVersion !== item.provenance?.pipelineVersion) throw new SchoolError(409, "Metoda analizy się zmieniła. Nie zapisano nieporównywalnej wersji.");
    }
    await completeSchoolRevision(id, member.schoolId, leaseId, report, provenance, testAccess);
    reserved = null;
    return NextResponse.json({ ok: true, version: reservation.version }, { headers: privateHeaders });
  } catch (error) {
    if (reserved) await releaseSchoolRevision(reserved.id, reserved.schoolId, reserved.leaseId).catch(() => undefined);
    return schoolFailure(error instanceof SchoolError ? error : new SchoolError(400, "Nie udało się odczytać lub przeanalizować CV. Sprawdź plik i spróbuj ponownie."));
  }
}
