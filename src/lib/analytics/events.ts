export const analyticsEvents = [
  "page_view", "landing_view", "hero_cta_clicked", "sample_report_viewed", "pricing_viewed",
  "file_picker_opened", "file_picker_cancelled", "upload_started", "upload_completed",
  "desktop_handoff_started", "desktop_handoff_completed", "handoff_link_opened",
  "analysis_started", "analysis_succeeded", "analysis_failed", "analysis_configuration_failed",
  "teaser_viewed", "checkout_started", "checkout_cancelled", "checkout_expired", "payment_failed",
  "purchase", "full_report_viewed", "feedback_submitted", "delete_requested",
] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];

const attributionKeys = ["source", "medium", "campaign", "content", "term"] as const;
const measurementKeys = ["landing_variant", "broad_role_enum", "selected_seniority_enum", "handoff_origin"] as const;
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
  desktop_handoff_started: ["locale", "market", "plan", "handoff_method", ...measurementKeys, ...attributionKeys],
  desktop_handoff_completed: ["locale", "market", "plan", "handoff_method", ...measurementKeys, ...attributionKeys],
  handoff_link_opened: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  analysis_started: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  analysis_succeeded: ["locale", "market", "plan", "analysis_success", ...measurementKeys, ...attributionKeys],
  analysis_failed: ["locale", "market", "plan", "analysis_success", "error_category", ...measurementKeys, ...attributionKeys],
  analysis_configuration_failed: ["locale", "market", "plan", "analysis_success", ...measurementKeys, ...attributionKeys],
  teaser_viewed: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  checkout_started: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  checkout_cancelled: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  checkout_expired: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  payment_failed: ["locale", "market", "plan", ...measurementKeys, ...attributionKeys],
  purchase: ["transaction_id", "value", "currency", "plan", "locale", "market", ...measurementKeys, ...attributionKeys],
  full_report_viewed: ["locale", "market", "plan", ...measurementKeys],
  feedback_submitted: ["locale", "market", "plan", ...measurementKeys],
  delete_requested: ["locale", "market", ...measurementKeys],
};

const enumValues: Record<string, readonly string[]> = {
  locale: ["pl", "en"], market: ["pl", "en"], plan: ["full_review", "job_match"],
  broad_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform"],
  selected_seniority_enum: ["auto", "junior", "mid", "senior", "lead"],
  landing_variant: ["developer"], handoff_origin: ["google_cpc", "other"],
  upload_entrypoint: ["picker", "drop"], handoff_method: ["web_share", "clipboard"],
  currency: ["PLN", "EUR"], error_category: ["empty_file", "file_too_large", "unsupported_file_type", "invalid_file_signature", "invalid_file_mime", "unsafe_archive", "unreadable_document", "document_too_long", "not_a_cv", "invalid_target_role", "invalid_target_seniority", "invalid_job_description", "rate_limit", "model", "storage", "timeout", "configuration", "unknown"],
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
