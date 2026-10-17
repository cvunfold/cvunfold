import { hasSchoolReportAccess } from "@/lib/schools/access-policy";
import { schoolQueueEnabled, readQueueProgress } from "./upload-queue";
import { createHash } from "node:crypto";
import { readSchoolPackage } from "./package";
import { readSchoolContact, type SchoolContact } from "./contact";
import { getAnalysisById } from "@/lib/data/store";
import { requireSchool, requireSchoolGroup, schoolDatabase, SchoolError } from "./server";
import type { SchoolData, SchoolGroup, SchoolStudent } from "./model";
import type { CVReport } from "@/lib/ai/schemas/report";
import { hasSchoolTestAccess } from "./test-access";

type ContactRelation = { contact: unknown };
function comparisonKey(provenance: unknown) {
  const p = provenance as { model?: string; pipelineVersion?: string; assessmentVersion?: string } | null;
  return createHash("sha256").update(JSON.stringify([p?.model || "legacy", p?.pipelineVersion || "legacy", p?.assessmentVersion || "legacy"])).digest("hex");
}
type StudentRow = { review_provenance?: unknown; id: string; school_student_name: string; created_at: string; expires_at: string; paid_at: string | null; contact_details?: ContactRelation | ContactRelation[] | null; reports?: { full_report_json: CVReport } | Array<{ full_report_json: CVReport }> };
export async function readSchoolData(request: Request, groupId?: string): Promise<SchoolData> {
  const member = await requireSchool(request);
  const db = schoolDatabase();
  const { data: groupRows, error } = await db.from("school_groups").select("id,name,target_role,target_seniority")
    .eq("school_id", member.schoolId).order("created_at");
  if (error) throw new SchoolError(503, "Nie udało się odczytać grup.");
  const groups = (groupRows || []) as SchoolGroup[];
  const group = groupId ? groups.find(g => g.id === groupId) : groups[0];
  if (groupId && !group) throw new SchoolError(404, "Nie znaleziono grupy.");
  if (!group) return { backgroundUploadsEnabled: schoolQueueEnabled(), schoolName: member.schoolName, groups, groupId: null, students: [] };
  const [entitlement, queue] = await Promise.all([readSchoolPackage(group.id), schoolQueueEnabled() ? readQueueProgress(group.id, group.target_seniority) : Promise.resolve(null)]);
  const testAccess = hasSchoolTestAccess(request, member, group.id);
  const students: SchoolStudent[] = [];
  // Paginate to avoid PostgREST's default row limit silently corrupting group statistics.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("analyses").select("id,school_student_name,created_at,expires_at,paid_at,contact_details:reports(contact:full_report_json->schoolContact)")
      .eq("school_group_id", group.id).eq("status", "complete").gt("expires_at", new Date().toISOString())
      .order("created_at").order("id").range(offset, offset + 499);
    if (error) throw new SchoolError(503, "Nie udało się odczytać kursantów.");
    const rows = (data || []) as StudentRow[];
    const paidIds = rows.filter(row => hasSchoolReportAccess(Boolean(row.paid_at), entitlement, testAccess)).map(row => row.id);
    const reports = new Map<string, CVReport>();
    const provenanceKeys = new Map<string, string>();
    if (paidIds.length) {
      let reportQuery = db.from("analyses").select("id,review_provenance,reports(full_report_json)")
        .in("id", paidIds).eq("school_group_id", group.id)
        .eq("status", "complete").gt("expires_at", new Date().toISOString());
      if (!testAccess && !entitlement.paid && entitlement.source !== "invoice") reportQuery = reportQuery.not("paid_at", "is", null);
      const { data: paidRows, error: reportError } = await reportQuery;
      if (reportError) throw new SchoolError(503, "Nie udało się odczytać raportów.");
      for (const row of (paidRows || []) as StudentRow[]) {
        const relation = Array.isArray(row.reports) ? row.reports[0] : row.reports;
        if (relation) { reports.set(row.id, relation.full_report_json); provenanceKeys.set(row.id, comparisonKey(row.review_provenance)); }
      }
    }
    students.push(...rows.map(row => ({ id: row.id, name: row.school_student_name, contact: readSchoolContact((Array.isArray(row.contact_details) ? row.contact_details[0] : row.contact_details)?.contact), createdAt: row.created_at,
      expiresAt: row.expires_at, paid: hasSchoolReportAccess(Boolean(row.paid_at), entitlement), ...(testAccess && !row.paid_at ? { testAccess: true } : {}), comparisonKey: provenanceKeys.get(row.id), report: reports.get(row.id) || null })));
    if (rows.length < 500) break;
  }
  const unlocked = students.filter(s => s.report);
  if (unlocked.length) {
    const versions = await db.from("analysis_revisions").select("analysis_id,version,report,provenance").in("analysis_id", unlocked.map(s => s.id)).eq("status", "complete").order("version");
    if (versions.error) throw new SchoolError(503, "Historia wersji nie jest jeszcze skonfigurowana.");
    for (const row of versions.data || []) {
      const student = students.find(s => s.id === row.analysis_id);
      if (student && row.report) { student.initialReport ||= student.report!; student.report = row.report as CVReport; student.latestVersion = row.version; student.comparisonKey = comparisonKey(row.provenance); student.contact = readSchoolContact((student.report as CVReport & { schoolContact?: SchoolContact }).schoolContact) || student.contact; }
    }
  }
  return { schoolName: member.schoolName, groups, groupId: group.id, students, package: entitlement,
    ...(queue ? { backgroundUploadsEnabled: true, batches: queue.batches, analysisTiming: queue.timing } : {}),
    ...(testAccess ? { testAccessExpiresAt: process.env.SCHOOL_TEST_ACCESS_EXPIRES_AT } : {}) };
}

export async function authorizedSchoolAnalysis(request: Request, id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new SchoolError(404, "Nie znaleziono raportu.");
  const member = await requireSchool(request);
  const { data, error } = await schoolDatabase().from("analyses").select("school_group_id")
    .eq("id", id).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new SchoolError(503, "Nie udało się odczytać raportu.");
  if (!data?.school_group_id) throw new SchoolError(404, "Nie znaleziono raportu.");
  // The same server predicate protects both known and guessed analysis IDs.
  const context = await requireSchoolGroup(request, String(data.school_group_id));
  if (context.member.schoolId !== member.schoolId) throw new SchoolError(404, "Nie znaleziono raportu.");
  const analysis = await getAnalysisById(id);
  if (!analysis) throw new SchoolError(404, "Nie znaleziono raportu.");
  return { analysis, member, groupId: String(data.school_group_id) };
}
