import { createClient } from "@supabase/supabase-js";
import type { CVReport } from "@/lib/ai/schemas/report";
import { hashToken } from "@/lib/security/tokens";

export type AnalysisFeedback = { rating: number; accurate: string; issueId?: string; comment?: string };
export type Analysis = {
  id: string; createdAt: Date; expiresAt: Date; tokenHash: string; status: "complete" | "deleted";
  paid: boolean; plan: "full_review" | "job_match"; report: CVReport; feedback: AnalysisFeedback[];
};

type Store = { analyses: Map<string, Analysis>; events: Array<{ name: string; at: Date }> };
type StoredAnalysisRow = {
  id: string; created_at: string; expires_at: string; access_token_hash: string; status: "complete" | "deleted";
  paid_at: string | null; job_description_present: boolean;
  reports: { full_report_json: CVReport } | Array<{ full_report_json: CVReport }> | null;
  feedback: Array<{ rating: number; accurate: string; issue_id: string | null; comment: string | null }> | null;
};

const globalStore = globalThis as typeof globalThis & { __cvunfold?: Store };
const store: Store = globalStore.__cvunfold ?? { analyses: new Map(), events: [] };
globalStore.__cvunfold = store;

function supabaseClient() {
  if (process.env.MOCK_MODE === "true" || process.env.NODE_ENV === "test") return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function memoryGet(token: string): Analysis | undefined {
  const item = store.analyses.get(hashToken(token));
  if (!item || item.status === "deleted" || item.expiresAt < new Date()) return undefined;
  return item;
}

export async function saveAnalysis(token: string, analysis: Omit<Analysis, "tokenHash">): Promise<void> {
  const client = supabaseClient();
  const tokenHash = hashToken(token);
  if (!client) { store.analyses.set(tokenHash, { ...analysis, tokenHash }); return; }
  const { error: analysisError } = await client.from("analyses").insert({
    id: analysis.id, created_at: analysis.createdAt.toISOString(), updated_at: analysis.createdAt.toISOString(), status: analysis.status,
    locale: "pl", target_role: "Frontend Developer", target_seniority: "auto", job_description_present: analysis.plan === "job_match",
    parse_quality: "good", prompt_version: "review-pl-v1", rubric_version: "frontend-v1", review_model: process.env.OPENAI_REVIEW_MODEL,
    access_token_hash: tokenHash, expires_at: analysis.expiresAt.toISOString(), paid_at: analysis.paid ? analysis.createdAt.toISOString() : null,
  });
  if (analysisError) throw new Error("SUPABASE_SAVE_FAILED");
  const { error: reportError } = await client.from("reports").insert({ analysis_id: analysis.id, report_version: "v1", full_report_json: analysis.report });
  if (reportError) {
    await client.from("analyses").delete().eq("id", analysis.id);
    throw new Error("SUPABASE_SAVE_FAILED");
  }
}

export async function getAnalysis(token: string): Promise<Analysis | undefined> {
  const client = supabaseClient();
  if (!client) return memoryGet(token);
  const { data, error } = await client.from("analyses")
    .select("id,created_at,expires_at,access_token_hash,status,paid_at,job_description_present,reports(full_report_json),feedback(rating,accurate,issue_id,comment)")
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("SUPABASE_READ_FAILED");
  if (!data) return undefined;
  const row = data as unknown as StoredAnalysisRow;
  const reportRelation = Array.isArray(row.reports) ? row.reports[0] : row.reports;
  if (!reportRelation) throw new Error("SUPABASE_READ_FAILED");
  return {
    id: row.id, createdAt: new Date(row.created_at), expiresAt: new Date(row.expires_at), tokenHash: row.access_token_hash,
    status: row.status, paid: Boolean(row.paid_at), plan: row.job_description_present ? "job_match" : "full_review",
    report: reportRelation.full_report_json,
    feedback: (row.feedback || []).map((item) => ({ rating: item.rating, accurate: item.accurate,
      ...(item.issue_id ? { issueId: item.issue_id } : {}), ...(item.comment ? { comment: item.comment } : {}) })),
  };
}

export async function markAnalysisPaid(token: string): Promise<boolean> {
  const client = supabaseClient();
  if (!client) { const item = memoryGet(token); if (!item) return false; item.paid = true; return true; }
  const { data, error } = await client.from("analyses").update({ paid_at: new Date().toISOString() })
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").select("id").maybeSingle();
  if (error) throw new Error("SUPABASE_UPDATE_FAILED");
  return Boolean(data);
}

export async function addAnalysisFeedback(token: string, feedback: AnalysisFeedback): Promise<boolean> {
  const client = supabaseClient();
  if (!client) { const item = memoryGet(token); if (!item) return false; item.feedback.push(feedback); return true; }
  const { data: analysis, error: readError } = await client.from("analyses").select("id")
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (readError) throw new Error("SUPABASE_READ_FAILED");
  if (!analysis) return false;
  const { error } = await client.from("feedback").insert({ analysis_id: analysis.id, rating: feedback.rating, accurate: feedback.accurate,
    issue_id: feedback.issueId || null, comment: feedback.comment || null });
  if (error) throw new Error("SUPABASE_UPDATE_FAILED");
  return true;
}

export async function deleteAnalysis(token: string): Promise<boolean> {
  const client = supabaseClient();
  if (!client) { const item = memoryGet(token); if (!item) return false; store.analyses.delete(item.tokenHash); return true; }
  const { data, error } = await client.from("analyses").delete().eq("access_token_hash", hashToken(token)).select("id").maybeSingle();
  if (error) throw new Error("SUPABASE_DELETE_FAILED");
  return Boolean(data);
}

export async function cleanupExpired(now = new Date()): Promise<number> {
  const client = supabaseClient();
  if (!client) {
    let count = 0; for (const [key, item] of store.analyses) if (item.expiresAt <= now) { store.analyses.delete(key); count += 1; }
    return count;
  }
  const { count, error } = await client.from("analyses").delete({ count: "exact" }).lte("expires_at", now.toISOString());
  if (error) throw new Error("SUPABASE_DELETE_FAILED");
  return count || 0;
}

export function track(name: string): void { store.events.push({ name, at: new Date() }); }
export function diagnostics() {
  const values = [...store.analyses.values()];
  return { analyses: values.length, completed: values.filter((v) => v.status === "complete").length, paid: values.filter((v) => v.paid).length,
    deleted: values.filter((v) => v.status === "deleted").length, feedback: values.reduce((sum, v) => sum + v.feedback.length, 0),
    events: Object.fromEntries([...new Set(store.events.map((e) => e.name))].map((name) => [name, store.events.filter((e) => e.name === name).length])) };
}
