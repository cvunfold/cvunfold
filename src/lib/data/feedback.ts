import type { SupabaseClient } from "@supabase/supabase-js";
export type FeedbackValues = { rating: number; accurate: string; issueId?: string; comment?: string };
export class FeedbackConflict extends Error { constructor() { super("FEEDBACK_REQUEST_REUSED"); } }
export function sameFeedback(a: FeedbackValues, b: FeedbackValues) {
  return a.rating === b.rating && a.accurate === b.accurate && (a.issueId || "") === (b.issueId || "") && (a.comment || "") === (b.comment || "");
}
// Primary-key insert, never upsert: retries must not fire quality-count triggers twice.
export async function insertFeedbackOnce(db: SupabaseClient, analysisId: string, feedback: FeedbackValues, requestId: string, version = 0) {
  const inserted = await db.from("feedback").insert({ id: requestId, analysis_id: analysisId, report_version: version, rating: feedback.rating, accurate: feedback.accurate, issue_id: feedback.issueId || null, comment: feedback.comment || null });
  if (!inserted.error) return;
  if (inserted.error.code !== "23505") throw new Error("SUPABASE_UPDATE_FAILED");
  const existing = await db.from("feedback").select("rating,accurate,issue_id,comment,report_version").eq("id", requestId).eq("analysis_id", analysisId).maybeSingle();
  if (existing.error) throw new Error("SUPABASE_READ_FAILED");
  if (!existing.data || existing.data.report_version !== version || !sameFeedback(feedback, { rating: existing.data.rating, accurate: existing.data.accurate, issueId: existing.data.issue_id, comment: existing.data.comment })) throw new FeedbackConflict();
}
