export const analyticsEvents = [
  "page_view", "landing_view", "hero_cta_clicked", "sample_report_viewed", "pricing_viewed",
  "file_picker_opened", "file_picker_cancelled", "upload_started", "upload_completed",
  "role_autodetected", "role_autodetect_corrected",
  "desktop_handoff_started", "desktop_handoff_completed", "handoff_link_opened",
  "analysis_started", "analysis_succeeded", "analysis_failed", "analysis_configuration_failed",
  "teaser_viewed", "unlock_cta_viewed", "unlock_cta_clicked", "checkout_started", "checkout_cancelled", "checkout_expired", "payment_failed",
  "purchase", "full_report_viewed", "feedback_submitted", "delete_requested", "wallet_checkout_unavailable",
] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];
export const purchaseSurfaces = ["desktop_sidebar", "mobile_summary", "mobile_sticky", "report_paywall"] as const;
export type PurchaseSurface = (typeof purchaseSurfaces)[number];
export const purchasePaymentMethods = ["standard", "express_wallet", "apple_pay", "google_pay"] as const;
// Every failure path in the wallet element previously called onAvailabilityChange(false)
// and hid the button with no other trace — a Stripe IntegrationError from a bad element
// option looked identical to a device with no wallet configured, in every environment,
// with zero server-side symptom. This names which of those it actually was.
export const walletUnavailableReasons = ["session_unavailable", "element_error", "no_supported_method", "provider_error"] as const;
export type WalletUnavailableReason = (typeof walletUnavailableReasons)[number];
// broad_role_enum is recorded before the CV is parsed, so a `frontend_developer`
// reading is ambiguous: it is both the detector's answer and the form default.
// This says which one it was, and detected_role_enum says what the detector
// proposed even when the visitor then overrode it.
export const roleSources = ["autodetected", "user_chose", "not_detected", "detector_error", "not_run"] as const;
export type RoleSource = (typeof roleSources)[number];

export function parseRoleSource(value: unknown): RoleSource | null {
  const candidate = String(value || "");
  return roleSources.includes(candidate as RoleSource) ? candidate as RoleSource : null;
}

const attributionKeys = ["source", "medium", "campaign", "content", "term"] as const;
const measurementKeys = ["landing_variant", "broad_role_enum", "selected_seniority_enum", "handoff_origin"] as const;
export const TEASER_VARIANT = "evidence_v1" as const;
const teaserKeys = ["teaser_variant"] as const;
const allowed: Record<AnalyticsEvent, readonly string[]> = {
  page_view: ["locale", "market", "landing_variant"],
  landing_view: ["locale", "market", ...measurementKeys, ...attributionKeys],
  hero_cta_clicked: ["locale", "market", "placement", ...measurementKeys, ...attributionKeys],
  sample_report_viewed: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  pricing_viewed: ["locale", "market", ...measurementKeys, ...attributionKeys],
  file_picker_opened: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  file_picker_cancelled: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  upload_started: ["locale", "market", "plan", "upload_entrypoint", ...measurementKeys, ...attributionKeys],
  upload_completed: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  // broad_role_enum carries the role in play; detected_role_enum is what the
  // detector proposed, so a correction is the two disagreeing on one event.
  role_autodetected: ["locale", "market", "plan", "detected_role_enum", ...measurementKeys, ...attributionKeys],
  role_autodetect_corrected: ["locale", "market", "plan", "detected_role_enum", ...measurementKeys, ...attributionKeys],
  desktop_handoff_started: ["locale", "market", "plan", "handoff_method", ...measurementKeys, ...attributionKeys],
  desktop_handoff_completed: ["locale", "market", "plan", "handoff_method", ...measurementKeys, ...attributionKeys],
  handoff_link_opened: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  analysis_started: ["locale", "market", "plan", "role_source", "detected_role_enum", ...measurementKeys, ...attributionKeys],
  analysis_succeeded: ["locale", "market", "plan", "analysis_success", ...measurementKeys, ...attributionKeys],
  analysis_failed: ["locale", "market", "plan", "analysis_success", "error_category", ...measurementKeys, ...attributionKeys],
  analysis_configuration_failed: ["locale", "market", "plan", "analysis_success", ...measurementKeys, ...attributionKeys],
  teaser_viewed: ["locale", "market", "plan", ...teaserKeys, ...measurementKeys, ...attributionKeys],
  unlock_cta_viewed: ["locale", "market", "plan", "purchase_surface", "payment_method", ...teaserKeys, ...measurementKeys, ...attributionKeys],
  unlock_cta_clicked: ["locale", "market", "plan", "purchase_surface", "payment_method", ...teaserKeys, ...measurementKeys, ...attributionKeys],
  checkout_started: ["locale", "market", "plan", ...teaserKeys, ...measurementKeys, ...attributionKeys],
  checkout_cancelled: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  checkout_expired: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  payment_failed: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  purchase: ["transaction_id", "value", "currency", "plan", "locale", "market", ...teaserKeys, ...measurementKeys, ...attributionKeys],
  full_report_viewed: ["locale", "market", "plan", ...measurementKeys],
  feedback_submitted: ["locale", "market", "plan", ...measurementKeys],
  delete_requested: ["locale", "market", ...measurementKeys],
  wallet_checkout_unavailable: ["locale", "market", "plan", "purchase_surface", "reason", ...measurementKeys, ...attributionKeys],
};

const enumValues: Record<string, readonly string[]> = {
  locale: ["pl", "en"], market: ["pl", "en"], plan: ["full_review", "job_match"],
  broad_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform", "other"],
  detected_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform", "other"],
  selected_seniority_enum: ["auto", "junior", "mid", "senior", "lead"],
  role_source: roleSources,
  landing_variant: ["developer"], handoff_origin: ["google_cpc", "other"],
  teaser_variant: [TEASER_VARIANT],
  upload_entrypoint: ["picker", "drop"], handoff_method: ["web_share", "clipboard"],
  purchase_surface: purchaseSurfaces, payment_method: purchasePaymentMethods, reason: walletUnavailableReasons,
  currency: ["PLN", "EUR"], error_category: ["empty_file", "file_too_large", "unsupported_file_type", "invalid_file_signature", "invalid_file_mime", "unsafe_archive", "unreadable_document", "document_too_long", "not_a_cv", "invalid_target_role", "invalid_target_seniority", "invalid_job_description", "rate_limit", "verification", "model", "storage", "timeout", "configuration", "unknown"],
};

export function safeAnalyticsPayload(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  const allowedKeys = new Set(allowed[event]);
  const attributionKeySet = new Set<string>(attributionKeys);
  const safeAttributionValue = /^[\p{L}\p{N}._~+\- ]+$/u;
  const safeProperties = Object.fromEntries(Object.entries(properties).flatMap(([key, raw]) => {
    if (!allowedKeys.has(key)) return [];
    const value = typeof raw === "string" ? raw.slice(0, 160) : raw;
    if (attributionKeySet.has(key) && (typeof value !== "string" || !safeAttributionValue.test(value))) return [];
    if (enumValues[key] && (typeof value !== "string" || !enumValues[key].includes(value))) return [];
    if (key === "value" && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) return [];
    return [[key, value]];
  }));
  return { event, properties: safeProperties, timestamp: new Date().toISOString() };
}
