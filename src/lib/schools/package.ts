import { schoolDatabase, SchoolError } from "./server";
import { SCHOOL_PILOT } from "./pilot-plan";
export { SCHOOL_PILOT } from "./pilot-plan";
// paid is a compatibility flag for verified full access, not a Stripe transaction.
export type SchoolPackage = { paid: boolean; active?: boolean; source?: "invoice" | "legacy" | "none"; state?: "active" | "revoked" | "expired" | "inactive"; expiresAt?: string; used: number; limit: number };
export async function readSchoolPackage(groupId: string): Promise<SchoolPackage> {
  const db = schoolDatabase();
  const [{ data, error }, slots] = await Promise.all([
    db.rpc("school_group_access", { p_group_id: groupId }),
    db.from("school_upload_slots").select("analysis_id", { count: "exact", head: true }).eq("group_id", groupId).or(`state.eq.complete,lease_until.gt.${new Date().toISOString()}`),
  ]);
  if (error || slots.error || !data || typeof data.active !== "boolean") throw new SchoolError(503, "Dostęp szkoły nie jest jeszcze skonfigurowany.");
  return { paid: data.active, active: data.active, source: data.source, state: data.state, expiresAt: data.expiresAt || undefined, used: slots.count || 0, limit: SCHOOL_PILOT.seats };
}
export async function schoolUploadLease(action: "reserve" | "finish" | "release", groupId: string, schoolId: string, analysisId: string, leaseId: string) {
  const { data, error } = await schoolDatabase().rpc(`${action}_school_upload`, { p_group_id: groupId, p_school_id: schoolId, p_analysis_id: analysisId, p_lease_id: leaseId });
  if (error) throw new SchoolError(error.message.includes("SCHOOL_SEAT_LIMIT") ? 409 : 503, error.message.includes("SCHOOL_SEAT_LIMIT") ? "Wykorzystano limit 30 kursantów. Poprawione CV dodaj jako kolejną wersję w raporcie kursanta." : "Nie udało się zarezerwować miejsca w grupie.");
  if (action !== "release" && data !== true) throw new SchoolError(503, "Nie udało się zapisać miejsca kursanta.");
}
