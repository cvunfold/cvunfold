import { schoolDatabase, SchoolError, type SchoolMember } from "./server";
import { SCHOOL_UPLOAD_BUCKET } from "./upload-files";
import { INITIAL_ANALYSIS_MS, type SchoolAnalysisTiming, type SchoolUploadBatch } from "./upload-model";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";

export function schoolQueueEnabled() { return process.env.SCHOOL_BACKGROUND_UPLOADS_ENABLED === "true"; }
export type QueueJobRow = { id: string; batch_id: string; position: number; analysis_id: string; object_key: string; student_name: string; name_manual: boolean; file_name: string; file_size: number; status: string; lease_id: string; started_at?: string; error_code?: string; prepared_report?: unknown; prepared_meta?: unknown };
const messages: Record<string, string> = { UNREADABLE_DOCUMENT: "Nie można odczytać dokumentu. Prześlij tekstowy PDF lub DOCX.", NOT_A_CV: "Dokument nie wygląda jak CV.", UPLOAD_NOT_FINISHED: "Plik nie został w całości przesłany. Dodaj go ponownie.", WORKER_INTERRUPTED: "Analiza została przerwana. Dodaj to CV ponownie.", BATCH_EXPIRED: "Paczka wygasła przed przetworzeniem. Dodaj CV ponownie.", METHOD_CHANGED: "Zmieniły się kryteria analizy. Dodaj to CV ponownie.", ANALYSIS_FAILED: "Nie udało się przeanalizować CV. Pozostałe dokumenty są przetwarzane dalej." };
export function queueErrorMessage(code?: string) { return code ? messages[code] || messages.ANALYSIS_FAILED : undefined; }
export async function readQueueProgress(groupId: string, stage: string): Promise<{ batches: SchoolUploadBatch[]; timing: SchoolAnalysisTiming }> {
  const db = schoolDatabase();
  const selection = "id,status,created_at,school_upload_jobs(id,student_name,status,error_code,started_at,not_before,analysis_id,position)";
  const [active, recent, timing] = await Promise.all([
    db.from("school_upload_batches").select(selection).eq("group_id", groupId).neq("status", "complete").gt("expires_at", new Date().toISOString()).order("created_at").limit(30),
    db.from("school_upload_batches").select(selection).eq("group_id", groupId).eq("status", "complete").order("created_at", { ascending: false }).limit(3),
    db.rpc("school_upload_timing", { p_stage: stage, p_method: REVIEW_PIPELINE_VERSION }),
  ]);
  if (active.error || recent.error || timing.error) {
    // Log only bounded diagnostic codes, never query details or student data.
    const safeCode = (error: { code?: string } | null) => error ? (/^[A-Z0-9_]{1,32}$/.test(error.code || "") ? error.code : "UNKNOWN") : null;
    console.error("SCHOOL_QUEUE_PROGRESS_FAILED", { active: safeCode(active.error), recent: safeCode(recent.error), timing: safeCode(timing.error) });
    throw new SchoolError(503, "Kolejka paczek nie jest jeszcze skonfigurowana.");
  }
  return { timing: { averageMs: Number(timing.data?.averageMs) || INITIAL_ANALYSIS_MS, sampleCount: Number(timing.data?.sampleCount) || 0 },
    batches: [...(active.data || []), ...(recent.data || [])].map(b => ({ id: b.id, status: b.status, createdAt: b.created_at, jobs: (b.school_upload_jobs || []).sort((a,b) => a.position-b.position).map(j => ({ id: j.id, name: j.student_name, status: j.status, error: queueErrorMessage(j.error_code), startedAt: j.started_at, notBefore: j.not_before, analysisId: j.status === "complete" ? j.analysis_id : undefined })) })) as SchoolUploadBatch[] };
}
export async function getOwnedBatch(id: string, member: SchoolMember) {
  const { data, error } = await schoolDatabase().from("school_upload_batches").select("id,group_id,school_id,status,method_version,expires_at,school_upload_jobs(*)").eq("id",id).eq("school_id",member.schoolId).maybeSingle();
  if (error) throw new SchoolError(503,"Nie można teraz odczytać paczki.");
  if (!data) throw new SchoolError(404,"Nie znaleziono paczki.");
  return data;
}
export async function signBatchUploads(id: string, member: SchoolMember) {
  const batch = await getOwnedBatch(id,member), db = schoolDatabase();
  if (batch.status !== "uploading" || Date.parse(batch.expires_at) <= Date.now()) throw new SchoolError(409,"Ta paczka nie przyjmuje już plików.");
  const bucket = await db.storage.getBucket(SCHOOL_UPLOAD_BUCKET);
  if (bucket.error || !bucket.data || bucket.data.public || !bucket.data.file_size_limit || Number(bucket.data.file_size_limit) > 8*1024*1024) throw new SchoolError(503,"Prywatny magazyn paczek nie jest jeszcze skonfigurowany.");
  const jobs = await Promise.all((batch.school_upload_jobs as QueueJobRow[]).sort((a,b)=>a.position-b.position).map(async job => {
    const { data,error } = await db.storage.from(SCHOOL_UPLOAD_BUCKET).createSignedUploadUrl(job.object_key,{upsert:false});
    if (error || !data) throw new SchoolError(503,"Nie udało się przygotować przesyłania CV.");
    return { id: job.id, name: job.student_name, size: job.file_size, fileName: job.file_name, url: data.signedUrl };
  }));
  return { batchId:id,jobs };
}
export async function createQueuedBatch(member: SchoolMember, groupId:string, requestId:string, files:{name:string;size:number;studentName:string;manual:boolean}[]) {
  const {data,error}=await schoolDatabase().rpc("create_school_upload_batch",{p_school_id:member.schoolId,p_group_id:groupId,p_user_id:member.userId,p_request_id:requestId,p_method:REVIEW_PIPELINE_VERSION,p_files:files});
  if(error) throw new SchoolError(error.message.includes("SCHOOL_SEAT_LIMIT")?409:503,error.message.includes("SCHOOL_SEAT_LIMIT")?"Paczka przekracza pozostałe miejsca w grupie. Limit grupy wynosi 30 CV.":"Nie udało się zapisać paczki.");
  const batch = await getOwnedBatch(String(data), member);
  if (batch.status !== "uploading") return { batchId: String(data), alreadySubmitted: true, jobs: [] };
  return signBatchUploads(String(data),member);
}
export async function commitQueuedBatch(id:string,member:SchoolMember) {
  const batch=await getOwnedBatch(id,member),db=schoolDatabase();
  if(batch.status!=="uploading")return;
  const prefix=`${member.schoolId}/${id}`;
  const listing=await db.storage.from(SCHOOL_UPLOAD_BUCKET).list(prefix,{limit:100});
  if(listing.error)throw new SchoolError(503,"Nie można teraz potwierdzić przesłania plików.");
  const uploaded=(batch.school_upload_jobs as QueueJobRow[]).filter(job=>listing.data.some(file=>file.name===job.object_key.split("/").pop() && Number(file.metadata?.size)===job.file_size)).map(job=>job.id);
  const result=await db.rpc("queue_school_upload_batch",{p_batch_id:id,p_school_id:member.schoolId,p_uploaded:uploaded});
  if(result.error||result.data!==true)throw new SchoolError(503,"Nie udało się uruchomić paczki.");
}
export async function cleanQueueSources() {
  const db = schoolDatabase(), now = new Date().toISOString();
  const result = await db.from("school_upload_sources").select("object_key,expires_at")
    .or(`expires_at.lte.${now},and(ready_for_delete.eq.true,deleted_at.is.null)`).limit(100);
  if (result.error) throw new Error(["42P01", "PGRST205"].includes(result.error.code) ? "QUEUE_NOT_CONFIGURED" : "QUEUE_CLEANUP_FAILED");
  const rows = result.data || [], keys = rows.map(row => row.object_key);
  if (!keys.length) {
    const batches = await db.from("school_upload_batches").delete().lte("expires_at", now).eq("status", "complete");
    if (batches.error) throw new Error("QUEUE_CLEANUP_FAILED");
    return 0;
  }
  const removed = await db.storage.from(SCHOOL_UPLOAD_BUCKET).remove(keys);
  if (removed.error) throw new Error("QUEUE_CLEANUP_FAILED");
  const marked = await db.from("school_upload_sources").update({ deleted_at: now }).in("object_key", keys);
  if (marked.error) throw new Error("QUEUE_CLEANUP_FAILED");
  const expired = rows.filter(row => Date.parse(row.expires_at) <= Date.now()).map(row => row.object_key);
  if (expired.length) {
    const cleared = await db.from("school_upload_sources").delete().in("object_key", expired);
    if (cleared.error) throw new Error("QUEUE_CLEANUP_FAILED");
  }
  const batches = await db.from("school_upload_batches").delete().lte("expires_at", now).eq("status", "complete");
  if (batches.error) throw new Error("QUEUE_CLEANUP_FAILED");
  return keys.length;
}
