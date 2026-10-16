import type { Locale } from "@/lib/i18n";
import type { TargetRoleId } from "@/lib/roles";
import { ROLE_POLICIES, ROLE_POLICY_VERSION } from "./prompts/roles";
export const AI_ROLE_POLICY_VERSION = ROLE_POLICY_VERSION;
export function aiRolePolicy(role: TargetRoleId | undefined, _locale: Locale): string {
  void _locale;
  return role === "ai_llm_engineer" || role === "ai_automation_specialist" ? ROLE_POLICIES[role] : "";
}
