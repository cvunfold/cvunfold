import type { SchoolPackage } from "./package";

export function hasSchoolReportAccess(individuallyPaid: boolean, entitlement: Pick<SchoolPackage, "paid" | "source">, testAccess = false) {
  if (testAccess) return true;
  // An invoice-managed school follows the owner's current grant, including revocation.
  // Historical purchases are preserved only until the school moves to invoice access.
  return entitlement.paid || (entitlement.source !== "invoice" && individuallyPaid);
}
