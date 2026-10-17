import { localLiveEvaluationEnabled } from "@/lib/ai/local-live-evaluation";
import type { Analysis, Revision } from "@/lib/data/store";
import { getReportRevisions } from "@/lib/data/store";
import type { CVReport } from "@/lib/ai/schemas/report";
import type { ReviewProvenance } from "@/lib/ai/review-provenance";
import { getReviewPrompt } from "@/lib/ai/prompts";
import { reviewPromptVersion } from "@/lib/ai/review-prompt-version";
import { usesEvidenceAssessment } from "@/lib/ai/evidence-assessment";
import { getTargetRoleOptions, parseTargetRoleId } from "@/lib/roles";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
import { resolveReviewModel } from "@/lib/ai/model-config";
import { RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { schoolDatabase, SchoolError } from "./server";

export const SCHOOL_RECHECK_LIMIT = 1;
export function schoolReviewCriteria(item: Analysis) {
  const role = parseTargetRoleId(item.report.document.targetRole) || getTargetRoleOptions(item.locale).find(r => r.label === item.report.document.targetRole)?.id;
  if (!role) throw new SchoolError(409, "Nie można odtworzyć kryteriów tego raportu.");
  const stage = item.report.document.targetSeniority;
  const context = item.report.document.careerContext || (stage === "first_job" ? "first_job" : "standard");
  return { role, stage, context };
}
export function assertSchoolCriteriaCurrent(item: Analysis) {
  if (process.env.MOCK_MODE === "true" && !localLiveEvaluationEnabled() && process.env.NODE_ENV !== "production") return;
  const { role, stage, context } = schoolReviewCriteria(item);
  const expectedPrompt = reviewPromptVersion(getReviewPrompt(item.locale, stage, context, role).version, usesEvidenceAssessment(role, stage, context));
  if (item.report.rubricVersion !== RUBRIC_VERSION || item.report.promptVersion !== expectedPrompt
    || !item.provenance || item.provenance.pipelineVersion !== REVIEW_PIPELINE_VERSION || item.provenance.model !== resolveReviewModel()) {
    throw new SchoolError(409, "Metoda tej analizy uległa zmianie. Zachowujemy raport, ale nie porównujemy go z nową metodą.");
  }
}
export async function readSchoolVersions(item: Analysis, fullAccess: boolean, requested?: string | null) {
  let rows: Revision[] = []; let available = fullAccess;
  if (fullAccess) { try { rows = await getReportRevisions(item); } catch { available = false; } }
  const complete = rows.filter(r => r.status === "complete" && r.report);
  const version = !fullAccess ? 0 : requested == null ? complete.at(-1)?.version || 0 : Number(requested);
  const report = version === 0 ? item.report : complete.find(r => r.version === version)?.report;
  if (!Number.isInteger(version) || !report) throw new SchoolError(404, "Nie znaleziono wersji raportu.");
  return { report, version, iterationsAvailable: available, rechecksRemaining: available ? Math.max(0, SCHOOL_RECHECK_LIMIT - complete.length) : 0,
    recheckRunning: rows.some(r => r.status === "running" && r.leaseUntil > Date.now()),
    revisions: fullAccess ? [{ version: 0, createdAt: item.createdAt.toISOString(), score: item.report.summary.overallScore }, ...complete.map(r => ({ version: r.version, createdAt: r.createdAt, score: r.report!.summary.overallScore }))] : [] };
}
const revisionErrors: Record<string, [number, string]> = {
  PAYMENT_REQUIRED: [403, "Odblokuj raport lub pakiet grupy przed ponowną analizą."],
  REPORT_NOT_FOUND: [404, "Raport wygasł lub jest niedostępny."],
  REVISION_BUSY: [409, "Sprawdzenie tego CV już trwa. Zaczekaj na wynik."],
  REVISION_LIMIT: [409, "Ponowne sprawdzenie tego kursanta zostało wykorzystane."],
};
export function schoolRevisionFailure(message: string) {
  const code = Object.keys(revisionErrors).find(key => message.includes(key));
  const [status, text] = code ? revisionErrors[code] : [503, "Nie można zapisać kolejnej wersji. Spróbuj ponownie później."];
  return new SchoolError(status, text);
}
export async function reserveSchoolRevision(analysisId: string, schoolId: string, requestId: string, leaseId: string, testAccess: boolean) {
  const { data, error } = await schoolDatabase().rpc("reserve_school_revision", { p_analysis_id: analysisId, p_school_id: schoolId, p_request_id: requestId, p_lease_id: leaseId, p_test: testAccess });
  if (error) throw schoolRevisionFailure(error.message);
  return data as { version: number; status: "complete" | "running" };
}
export async function completeSchoolRevision(analysisId: string, schoolId: string, leaseId: string, report: CVReport, provenance: ReviewProvenance | null, testAccess: boolean) {
  const { data, error } = await schoolDatabase().rpc("complete_school_revision", { p_analysis_id: analysisId, p_school_id: schoolId, p_lease_id: leaseId, p_report: report, p_provenance: provenance, p_test: testAccess });
  if (error || data !== true) throw new SchoolError(503, "Nie udało się zapisać wersji. Odśwież raport przed kolejną próbą.");
}
export async function releaseSchoolRevision(analysisId: string, schoolId: string, leaseId: string) {
  const { error } = await schoolDatabase().rpc("release_school_revision", { p_analysis_id: analysisId, p_school_id: schoolId, p_lease_id: leaseId });
  if (error) throw schoolRevisionFailure(error.message);
}
