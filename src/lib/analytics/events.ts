export const analyticsEvents = ["landing_view", "primary_cta_clicked", "demo_report_viewed", "upload_started", "upload_completed", "analysis_started", "analysis_succeeded", "analysis_failed", "teaser_viewed", "checkout_started", "purchase_completed", "full_report_viewed", "feedback_submitted", "delete_requested"] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];

export function safeAnalyticsPayload(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  const forbidden = ["cv", "email", "phone", "name", "report", "prompt", "job_description"];
  for (const key of Object.keys(properties)) if (forbidden.some((word) => key.toLowerCase().includes(word))) delete properties[key];
  return { event, properties, timestamp: new Date().toISOString() };
}
