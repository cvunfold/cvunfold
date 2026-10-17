import { z } from "zod";
import { schoolDatabase, SchoolError } from "./server";

export const invoiceAccessChange = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"), schoolId: z.string().uuid(), requestId: z.string().uuid(), invoiceReference: z.string().trim().min(1).max(120), expiresAt: z.string().datetime({ offset: true }) }).strict(),
  z.object({ action: z.literal("revoke"), schoolId: z.string().uuid(), requestId: z.string().uuid() }).strict(),
]);
export type InvoiceAccessChange = z.infer<typeof invoiceAccessChange>;

export async function readInvoiceAccess(schoolId: string) {
  const db = schoolDatabase();
  const [school, access] = await Promise.all([
    db.from("schools").select("id,name").eq("id", schoolId).maybeSingle(),
    db.from("school_invoice_access").select("state,invoice_reference,expires_at,activated_at,revoked_at,updated_at").eq("school_id", schoolId).maybeSingle(),
  ]);
  if (school.error || access.error) throw new SchoolError(503, "Dostęp pod faktury nie jest jeszcze skonfigurowany.");
  if (!school.data) throw new SchoolError(404, "Nie znaleziono szkoły.");
  return { school: school.data, access: access.data, active: access.data?.state === "active" && Date.parse(access.data.expires_at) > Date.now() };
}

export async function changeInvoiceAccess(change: InvoiceAccessChange) {
  const { data, error } = await schoolDatabase().rpc("change_school_invoice_access", {
    p_school_id: change.schoolId, p_request_id: change.requestId, p_action: change.action,
    p_invoice_reference: change.action === "activate" ? change.invoiceReference : null,
    p_expires_at: change.action === "activate" ? change.expiresAt : null,
  });
  if (error) {
    if (error.message.includes("SCHOOL_NOT_FOUND")) throw new SchoolError(404, "Nie znaleziono szkoły.");
    if (error.message.includes("SCHOOL_ACCESS_REQUEST_REUSED")) throw new SchoolError(409, "Ten identyfikator był już użyty dla innej zmiany.");
    if (error.message.includes("INVALID_ACCESS_CHANGE")) throw new SchoolError(400, "Podaj numer faktury i przyszłą datę końca dostępu.");
    if (error.message.includes("INVOICE_ACCESS_NOT_FOUND")) throw new SchoolError(409, "Ta szkoła nie ma aktywacji pod fakturę do cofnięcia.");
    throw new SchoolError(503, "Nie udało się zmienić dostępu szkoły.");
  }
  if (!data || typeof data.replayed !== "boolean") throw new SchoolError(503, "Nie udało się potwierdzić zmiany dostępu.");
  return { replayed: data.replayed as boolean, ...await readInvoiceAccess(change.schoolId) };
}
