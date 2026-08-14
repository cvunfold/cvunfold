import { describe, expect, it } from "vitest";
import { TARGET_ROLES, getTargetRoleProfile, parseTargetRoleId } from "@/lib/roles";

describe("target roles", () => {
  it("offers six optimized technical specializations and an experimental fallback", () => {
    expect(TARGET_ROLES.map((role) => role.id)).toEqual([
      "frontend_developer",
      "backend_developer",
      "fullstack_developer",
      "mobile_developer",
      "qa_test_automation",
      "devops_platform",
      "other",
    ]);
  });

  it("rejects unsupported or future disciplines", () => {
    expect(parseTargetRoleId("product_manager")).toBeNull();
    expect(parseTargetRoleId("designer")).toBeNull();
    expect(parseTargetRoleId("qa_test_automation")).toBe("qa_test_automation");
    expect(parseTargetRoleId("other")).toBe("other");
  });

  it("defines role-specific evaluation focus", () => {
    expect(getTargetRoleProfile("qa_test_automation").evaluationFocus.join(" ")).toContain("ryzyka");
    expect(getTargetRoleProfile("devops_platform").evaluationFocus.join(" ")).toContain("observability");
    expect(getTargetRoleProfile("other").experimental).toBe(true);
    expect(getTargetRoleProfile("other", "en").label).toBe("Other");
    expect(getTargetRoleProfile("other", "en").credibilityLabel).toBe("Professional credibility");
  });
});
