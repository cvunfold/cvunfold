import { expect, it } from "vitest";
import cases from "../fixtures/modular-eval-cases.json";
import { TARGET_ROLES, type TargetRoleId } from "@/lib/roles";
import { SENIORITIES } from "@/lib/rubrics/technical-v1";
import { getReviewPrompt } from "@/lib/ai/prompts";
it("covers all roles/stages and factual, language and safety boundary cases", () => {
  expect(new Set(cases.map(item => item.targetRole))).toEqual(new Set(TARGET_ROLES.map(role => role.id)));
  expect(new Set(cases.map(item => item.targetSeniority))).toEqual(new Set(SENIORITIES));
  expect(cases.some(item => "injection" in item && item.injection)).toBe(true);
  expect(cases.some(item => "protectedTraits" in item && item.protectedTraits)).toBe(true);
  expect(cases.some(item => item.id.includes("mixed-language"))).toBe(true);
  expect(cases.some(item => item.id.includes("historical-attribution"))).toBe(true);
  expect(cases.some(item => item.id.includes("copied"))).toBe(true);
  for (const item of cases) for (const locale of ["pl", "en"] as const) {
    expect(item.cv[locale].length).toBeGreaterThan(100);
    expect(getReviewPrompt(locale, item.targetSeniority as typeof SENIORITIES[number], "careerContext" in item ? "first_job" : "standard", item.targetRole as TargetRoleId).assessmentPrompt).toContain(item.targetRole);
  }
});
