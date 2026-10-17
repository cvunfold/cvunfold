import { expect, it } from "vitest";
import { hasAffirmativeManualRoutingClaim } from "@/lib/ai/manual-routing-tripwire";
it("alarms on the original unsupported operational claims", () => {
  expect(hasAffirmativeManualRoutingClaim("Incorrect results were routed to a person.")).toBe(true);
  expect(hasAffirmativeManualRoutingClaim("Opis obejmuje skierowanie błędnych wyników do ręcznej kontroli.")).toBe(true);
});
it("does not alarm on explicit denials and requests for clarification", () => {
  expect(hasAffirmativeManualRoutingClaim("It does not establish that incorrect results were routed to a person.")).toBe(false);
  expect(hasAffirmativeManualRoutingClaim("Nie należy zakładać, że wyniki są kierowane do ręcznej kontroli.")).toBe(false);
  expect(hasAffirmativeManualRoutingClaim("Clarify whether routing was implemented.")).toBe(false);
});
