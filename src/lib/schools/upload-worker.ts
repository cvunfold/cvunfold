import { runtimeEnvironmentFrom } from "@/lib/runtime-environment";
import { schoolDatabase } from "./server";
import { cleanQueueSources, schoolQueueEnabled, type QueueJobRow } from "./upload-queue";
import { SCHOOL_UPLOAD_BUCKET } from "./upload-files";
import { readSchoolPackage } from "./package";
import { parseDocument } from "@/lib/document-parsing";
import { validateCvText } from "@/lib/document-parsing/cv-detection";
import { validateSignature, validateUpload } from "@/lib/security/upload";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
import { runAtsChecker } from "@/lib/ats-checker";
import { parseTargetRoleId } from "@/lib/roles";
import { parseSeniority } from "@/lib/rubrics/technical-v1";
import { consumeAnalysisQuota } from "@/lib/security/rate-limit";
import { createAccessToken, hashToken, hmacIdentifier } from "@/lib/security/tokens";

// Each invocation performs one leased job. Cron owns continuation; no browser is needed.
// Persist the generated result before saving the report, so recovery does not call AI twice.
export async function runSchoolUploadJob(schoolId?: string): Promise<boolean> {
  if (!schoolQueueEnabled() || process.env.MOCK_MODE === "true" || !process.env.OPENAI_API_KEY) return false;
  const db = schoolDatabase();
  const claim = await db.rpc("claim_school_upload_job", { p_school_id: schoolId || null });
  if (claim.error) throw new Error("QUEUE_CLAIM_FAILED");
  const job = claim.data as QueueJobRow | null;
  if (!job) return false;
  let checkpointed = Boolean(job.prepared_report);
  try {
    if (!checkpointed) {
      const batch = await db.from("school_upload_batches").select("group_id,school_id,method_version").eq("id", job.batch_id).single();
      if (batch.error || !batch.data) throw new Error("ANALYSIS_FAILED");
      if (batch.data.method_version !== REVIEW_PIPELINE_VERSION) throw new Error("METHOD_CHANGED");
      const group = await db.from("school_groups").select("target_role,target_seniority").eq("id", batch.data.group_id).eq("school_id", batch.data.school_id).single();
      const role = parseTargetRoleId(group.data?.target_role), seniority = parseSeniority(group.data?.target_seniority);
      if (group.error || !role || !seniority) throw new Error("ANALYSIS_FAILED");
      const entitlement = await readSchoolPackage(batch.data.group_id);
      const quota = await consumeAnalysisQuota(hmacIdentifier(`school-analysis:${batch.data.school_id}`), entitlement.paid ? 60 : 20, entitlement.paid ? 120 : 50);
      if (!quota.allowed) {
        const deferred = await db.rpc("defer_school_upload_job", { p_job_id: job.id, p_lease_id: job.lease_id, p_seconds: quota.retryAfterSeconds });
        if (deferred.error) throw new Error("QUEUE_SAVE_FAILED");
        return true;
      }
      const started = Date.now();
      const source = await db.storage.from(SCHOOL_UPLOAD_BUCKET).download(job.object_key);
      if (source.error || !source.data || source.data.size !== job.file_size) throw new Error("UNREADABLE_DOCUMENT");
      const file = new File([source.data], job.file_name, { type: /\.pdf$/i.test(job.file_name) ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      validateUpload(file); await validateSignature(file);
      const parsed = await parseDocument(file, { includeContact: true });
      validateCvText(parsed.text);
      const careerContext = seniority === "first_job" ? "first_job" : "standard";
      const [review, ats] = await Promise.all([
        reviewWithOpenAI({ segments: parsed.segments, targetRole: role, targetSeniority: seniority, careerContext, locale: "pl" }),
        runAtsChecker(file, parsed),
      ]);
      const report = { ...review.report, ats, ...(parsed.sourceContact ? { schoolContact: parsed.sourceContact } : {}) };
      report.document.careerContext = careerContext;
      const expiry = Math.min(Date.now() + Number(process.env.REPORT_RETENTION_DAYS || 30) * 86_400_000,
        entitlement.paid && entitlement.expiresAt ? Date.parse(entitlement.expiresAt) : Infinity);
      const meta = { ...review.telemetry, tokenHash: hashToken(createAccessToken()), expiresAt: new Date(expiry).toISOString(), durationMs: Date.now() - started,
        documentKind: parsed.diagnostics.document_kind, environment: runtimeEnvironmentFrom() };
      const saved = await db.from("school_upload_jobs").update({ prepared_report: report, prepared_meta: meta,
        ...(!job.name_manual && parsed.sourceStudentName ? { student_name: parsed.sourceStudentName } : {}) })
        .eq("id", job.id).eq("lease_id", job.lease_id).eq("status", "processing").gt("lease_until", new Date().toISOString()).select("id").maybeSingle();
      if (saved.error || !saved.data) throw new Error("QUEUE_SAVE_FAILED");
      checkpointed = true;
    }
    const committed = await db.rpc("complete_school_upload_job", { p_job_id: job.id, p_lease_id: job.lease_id });
    if (committed.error || committed.data !== true) throw new Error("QUEUE_SAVE_FAILED");
  } catch (error) {
    // A checkpoint is retained for lease recovery if the final transaction failed.
    if (!checkpointed) {
      const code = error instanceof Error && ["UNREADABLE_DOCUMENT", "NOT_A_CV", "METHOD_CHANGED"].includes(error.message) ? error.message : "ANALYSIS_FAILED";
      const failed = await db.rpc("fail_school_upload_job", { p_job_id: job.id, p_lease_id: job.lease_id, p_code: code });
      if (failed.error) throw new Error("QUEUE_SAVE_FAILED");
    }
  }
  await cleanQueueSources();
  return true;
}
export async function processSchoolQueue(schoolId?: string) {
  const results = await Promise.allSettled([runSchoolUploadJob(schoolId), ...(schoolId ? [] : [runSchoolUploadJob()])]);
  await cleanQueueSources();
  if (results.some(result => result.status === "rejected")) throw new Error("QUEUE_PROCESS_FAILED");
}
