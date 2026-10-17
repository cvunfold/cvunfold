// This consent version names both Google and LinkedIn. A previous Google-only
// permission must never silently opt someone into a new advertising recipient.
export const MEASUREMENT_CONSENT_VERSION = "google-linkedin-2026-10-13";
export const LINKEDIN_CLICK_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function validLinkedInClickId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}
