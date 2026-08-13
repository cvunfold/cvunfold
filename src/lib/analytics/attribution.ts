import { z } from "zod";
import { HANDOFF_ORIGINS, LANDING_VARIANTS } from "@/lib/audience";
import { TARGET_ROLES } from "@/lib/roles";
import { SENIORITIES } from "@/lib/rubrics/technical-v1";

const value = z.string().trim().min(1).max(160).regex(/^[\p{L}\p{N}._~+\- ]+$/u);

export const attributionSchema = z.object({
  source: value.optional(),
  medium: value.optional(),
  campaign: value.optional(),
  content: value.optional(),
  term: value.optional(),
  gclid: value.max(200).optional(),
  gbraid: value.max(200).optional(),
  wbraid: value.max(200).optional(),
  landing_variant: z.enum(LANDING_VARIANTS).optional(),
  broad_role_enum: z.enum(TARGET_ROLES.map((role) => role.id) as [typeof TARGET_ROLES[number]["id"], ...typeof TARGET_ROLES[number]["id"][]]).optional(),
  selected_seniority_enum: z.enum(SENIORITIES).optional(),
  handoff_origin: z.enum(HANDOFF_ORIGINS).optional(),
}).strict();

export type Attribution = z.infer<typeof attributionSchema>;

export function parseAttribution(value: unknown): Attribution {
  const parsed = attributionSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
