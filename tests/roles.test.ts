import { describe, expect, it } from "vitest";
import { TARGET_ROLES, getTargetRoleProfile, parseTargetRoleId } from "@/lib/roles";

describe("technical target roles", () => {
  it("offers the intentional first six technical specializations", () => {
    expect(TARGET_ROLES.map((role) => role.id)).toEqual([
      "frontend_developer",
      "backend_developer",
      "fullstack_developer",
      "mobile_developer",
      "qa_test_automation",
      "devops_platform",
    ]);
  });

  it("rejects unsupported or future disciplines", () => {
    expect(parseTargetRoleId("product_manager")).toBeNull();
    expect(parseTargetRoleId("designer")).toBeNull();
    expect(parseTargetRoleId("qa_test_automation")).toBe("qa_test_automation");
  });

  it("defines role-specific evaluation focus", () => {
    expect(getTargetRoleProfile("qa_test_automation").evaluationFocus.join(" ")).toContain("ryzyka");
    expect(getTargetRoleProfile("devops_platform").evaluationFocus.join(" ")).toContain("observability");
  });
});
