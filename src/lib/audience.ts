import { parseTargetRoleId, type TargetRoleId } from "@/lib/roles";
import { parseSeniority, type Seniority } from "@/lib/rubrics/technical-v1";

export const LANDING_VARIANTS = ["developer"] as const;
export type LandingVariant = (typeof LANDING_VARIANTS)[number];
export const DEFAULT_LANDING_VARIANT: LandingVariant = "developer";

export const HANDOFF_ORIGINS = ["google_cpc", "other"] as const;
export type HandoffOrigin = (typeof HANDOFF_ORIGINS)[number];

export type MeasurementContext = {
  landing_variant: LandingVariant;
  broad_role_enum: TargetRoleId;
  selected_seniority_enum: Seniority;
  handoff_origin?: HandoffOrigin;
};

export const DEFAULT_MEASUREMENT_CONTEXT: MeasurementContext = {
  landing_variant: DEFAULT_LANDING_VARIANT,
  broad_role_enum: "frontend_developer",
  selected_seniority_enum: "auto",
};

export function parseLandingVariant(value: unknown): LandingVariant | null {
  return LANDING_VARIANTS.includes(value as LandingVariant) ? value as LandingVariant : null;
}

export function parseHandoffOrigin(value: unknown): HandoffOrigin | null {
  return HANDOFF_ORIGINS.includes(value as HandoffOrigin) ? value as HandoffOrigin : null;
}

export function handoffOriginFromAttribution(attribution: Record<string, unknown>): HandoffOrigin {
  return attribution.source === "google" && attribution.medium === "cpc" ? "google_cpc" : "other";
}

export function measurementContextFromAttribution(attribution: Record<string, unknown>): MeasurementContext {
  const handoffOrigin = parseHandoffOrigin(attribution.handoff_origin);
  return {
    landing_variant: parseLandingVariant(attribution.landing_variant) || DEFAULT_LANDING_VARIANT,
    broad_role_enum: parseTargetRoleId(attribution.broad_role_enum) || DEFAULT_MEASUREMENT_CONTEXT.broad_role_enum,
    selected_seniority_enum: parseSeniority(attribution.selected_seniority_enum) || DEFAULT_MEASUREMENT_CONTEXT.selected_seniority_enum,
    ...(handoffOrigin ? { handoff_origin: handoffOrigin } : {}),
  };
}
