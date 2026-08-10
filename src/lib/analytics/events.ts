export const analyticsEvents = [
  "page_view", "landing_view", "hero_cta_clicked", "sample_report_viewed", "pricing_viewed",
  "upload_started", "upload_completed", "analysis_started", "analysis_succeeded", "analysis_failed", "analysis_configuration_failed",
  "teaser_viewed", "checkout_started", "checkout_cancelled", "checkout_expired", "payment_failed",
  "purchase", "full_report_viewed", "feedback_submitted", "delete_requested",
] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];

const attributionKeys = ["source", "medium", "campaign", "content", "term"] as const;
const allowed: Record<AnalyticsEvent, readonly string[]> = {
  page_view: ["locale", "market"],
  landing_view: ["locale", "market", ...attributionKeys],
  hero_cta_clicked: ["locale", "market", "placement", ...attributionKeys],
  sample_report_viewed: ["locale", "market", "placement", ...attributionKeys],
  pricing_viewed: ["locale", "market", ...attributionKeys],
  upload_started: ["locale", "market", "plan", "broad_role_enum", "selected_seniority_enum", ...attributionKeys],
  upload_completed: ["locale", "market", "plan", "broad_role_enum", "selected_seniority_enum", ...attributionKeys],
  analysis_started: ["locale", "market", "plan", "broad_role_enum", "selected_seniority_enum", ...attributionKeys],
  analysis_succeeded: ["locale", "market", "plan", "analysis_success", ...attributionKeys],
  analysis_failed: ["locale", "market", "plan", "analysis_success", "error_category", ...attributionKeys],
  analysis_configuration_failed: ["locale", "market", "plan", "analysis_success", ...attributionKeys],
  teaser_viewed: ["locale", "market", "plan", ...attributionKeys],
  checkout_started: ["locale", "market", "plan", ...attributionKeys],
  checkout_cancelled: ["locale", "market", "plan", ...attributionKeys],
  checkout_expired: ["locale", "market", "plan", ...attributionKeys],
  payment_failed: ["locale", "market", "plan", ...attributionKeys],
  purchase: ["transaction_id", "value", "currency", "plan", "locale", "market", ...attributionKeys],
  full_report_viewed: ["locale", "market", "plan"],
  feedback_submitted: ["locale", "market", "plan"],
  delete_requested: ["locale", "market"],
};

const enumValues: Record<string, readonly string[]> = {
  locale: ["pl", "en"], market: ["pl", "en"], plan: ["full_review", "job_match"],
  broad_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform"],
  selected_seniority_enum: ["auto", "junior", "mid", "senior", "lead"],
  currency: ["PLN", "EUR"], error_category: ["empty_file", "file_too_large", "unsupported_file_type", "invalid_file_signature", "invalid_file_mime", "unsafe_archive", "unreadable_document", "document_too_long", "not_a_cv", "invalid_target_role", "rate_limit", "model", "storage", "timeout", "configuration", "unknown"],
};

export function safeAnalyticsPayload(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  const allowedKeys = new Set(allowed[event]);
  const safeProperties = Object.fromEntries(Object.entries(properties).flatMap(([key, raw]) => {
    if (!allowedKeys.has(key)) return [];
    const value = typeof raw === "string" ? raw.slice(0, 160) : raw;
    if (enumValues[key] && (typeof value !== "string" || !enumValues[key].includes(value))) return [];
    if (key === "value" && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) return [];
    return [[key, value]];
  }));
  return { event, properties: safeProperties, timestamp: new Date().toISOString() };
}
