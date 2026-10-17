import { describe, expect, it } from "vitest";
import { activePromptVariant, getReviewPrompt } from "@/lib/ai/prompts";
import { TARGET_ROLES } from "@/lib/roles";
import { SENIORITIES } from "@/lib/rubrics/technical-v1";
import { ROLE_POLICIES } from "@/lib/ai/prompts/roles";
import { LANGUAGE_POLICIES } from "@/lib/ai/prompts/languages";

describe("canonical prompt composition", () => {
  it("keeps archived selectors out of the active pipeline", () => {
    expect(activePromptVariant()).toBe("modular-v3");
    expect(getReviewPrompt("pl").version).toContain("review-modular-v3.1.2");
  });
  for (const role of TARGET_ROLES) for (const stage of SENIORITIES) for (const context of ["standard", "first_job"] as const) it(`${role.id}/${stage}/${context} shares assessment rules across output languages`, () => {
    const pl = getReviewPrompt("pl", stage, context, role.id), en = getReviewPrompt("en", stage, context, role.id);
    expect(pl.assessmentPrompt).toBe(en.assessmentPrompt);
    for (const [locale, prompt] of [["pl", pl], ["en", en]] as const) {
      expect(prompt.systemPrompt).toContain(ROLE_POLICIES[role.id]);
      expect(prompt.systemPrompt).toContain(LANGUAGE_POLICIES[locale]);
      expect(prompt.systemPrompt.match(/# Selected stage:/g)).toHaveLength(1);
      expect(prompt.systemPrompt).toContain("UNTRUSTED DATA");
      expect(prompt.version).toContain(`roles-v2.0.0:${role.id}`);
      expect(prompt.systemPrompt.length).toBeLessThan(14000);
      expect(prompt.assessmentPrompt.length).toBeLessThan(20000);
    }
  });
});
