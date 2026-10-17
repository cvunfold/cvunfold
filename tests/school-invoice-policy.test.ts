import { expect, it } from "vitest";
import { hasSchoolReportAccess } from "@/lib/schools/access-policy";
it("honors expiry and revocation for an invoice-managed school even with historical paid reports", () => {
  expect(hasSchoolReportAccess(true, { paid: false, source: "invoice" })).toBe(false);
  expect(hasSchoolReportAccess(false, { paid: true, source: "invoice" })).toBe(true);
  expect(hasSchoolReportAccess(true, { paid: false, source: "none" })).toBe(true);
});
