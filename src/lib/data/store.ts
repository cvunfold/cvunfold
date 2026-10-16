import { insertFeedbackOnce, sameFeedback, FeedbackConflict } from "./feedback";
import { createClient } from "@supabase/supabase-js";
import type { CVReport } from "@/lib/ai/schemas/report";
import type { ReviewProvenance } from "@/lib/ai/review-provenance";
import type { Attribution } from "@/lib/analytics/attribution";
import {
  classifyAnonymousRole,
  classifyAnonymousSource,
  summarizeAnonymousRoleStatistics,
  type AnonymousRoleAggregateRow,
} from "@/lib/analytics/anonymous-role-statistics";
import type { Locale } from "@/lib/i18n";
import type { Market, Plan } from "@/lib/plans";
import { runtimeEnvironmentFrom, type RuntimeEnvironment } from "@/lib/runtime-environment";
import { hashToken } from "@/lib/security/tokens";
import { hasReportCodeAccess } from "@/lib/security/report-access-code";

export type AnalysisFeedback = { submissionId?: string; reportVersion?: number; rating: number; accurate: string; issueId?: string; comment?: string };
export type Analysis = {
  id: string; createdAt: Date; expiresAt: Date; tokenHash: string; status: "complete" | "deleted";
  paid: boolean; plan: Plan; locale: Locale; market: Market; attribution: Attribution;
  report: CVReport; feedback: AnalysisFeedback[]; durationMs?: number; purchase?: Purchase;
  model?: string; inputTokens?: number; outputTokens?: number; estimatedAiCost?: number | null;
  provenance?: ReviewProvenance;
  // From the extraction diagnostics. Sizes how much traffic a scanned PDF costs
  // us: every unreadable_document failure so far has been a PDF with no text layer.
  documentKind?: "pdf" | "docx";
  schoolGroupId?: string;
  schoolStudentName?: string;
  accessCodeHash?: string;
  accessCodeGrantedAt?: Date;
};
export type Purchase = { transactionId: string; value: number; currency: string; plan: Plan; paidAt?: string };
export type PendingPayment = {
  analysisId: string; checkoutSessionId: string; plan: Plan; locale: Locale; market: Market; amountGross: number; currency: string;
};
export type StripePayment = PendingPayment & {
  eventId: string; paymentIntentId: string | null; customerId: string | null;
};

type Store = {
  analyses: Map<string, Analysis>;
  events: Array<{ name: string; at: Date }>;
  eventDedupeKeys: Set<string>;
  anonymousRoleCounts: Map<string, number>;
  revisions?: Map<string, Revision[]>;
};
type StoredAnalysisRow = {
  access_code_hash?: string | null; access_code_granted_at?: string | null;
  id: string; created_at: string; expires_at: string; access_token_hash: string; status: "complete" | "deleted";
  paid_at: string | null; job_description_present: boolean; locale: Locale; market: Market; attribution: Attribution | null; duration_ms: number | null;
  school_group_id?: string; school_student_name?: string; review_provenance?: ReviewProvenance; review_model?: string;
  reports: { full_report_json: CVReport } | Array<{ full_report_json: CVReport }> | null;
  feedback: Array<{ rating: number; accurate: string; issue_id: string | null; comment: string | null }> | null;
  payments: Array<{ stripe_checkout_session_id: string | null; amount_gross: number; currency: string; plan: Plan; status: string; paid_at: string | null }> | null;
};

const globalStore = globalThis as typeof globalThis & { __cvunfold?: Store };
const store: Store = globalStore.__cvunfold ?? { analyses: new Map(), events: [], eventDedupeKeys: new Set(), anonymousRoleCounts: new Map() };
store.eventDedupeKeys ??= new Set();
store.anonymousRoleCounts ??= new Map();
store.revisions ??= new Map();
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

/**
 * A finished analysis has already cost an OpenAI call, so one failed write must not discard it.
 * Each attempt gets a fresh token and id: a partially written attempt can leave rows behind,
 * and reusing the same identifiers would turn a transient failure into a permanent conflict.
 */
export async function saveAnalysisWithRetry<T extends { id: string }>(
  attempt: () => { token: string; analysis: T },
  save: (token: string, analysis: T) => Promise<void> = (token, analysis) => saveAnalysis(token, analysis as unknown as Omit<Analysis, "tokenHash">),
  { attempts = 3, delayMs = 250 }: { attempts?: number; delayMs?: number } = {},
): Promise<{ token: string; analysisId: string }> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    const { token, analysis } = attempt();
    try {
      await save(token, analysis);
      return { token, analysisId: analysis.id };
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs * (index + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("SUPABASE_SAVE_FAILED");
}

export async function saveAnalysis(token: string, analysis: Omit<Analysis, "tokenHash">): Promise<void> {
  const client = supabaseClient();
  const tokenHash = hashToken(token);
  if (!client) {
    const isNewAnalysis = !store.analyses.has(tokenHash);
    store.analyses.set(tokenHash, { ...analysis, tokenHash });
    if (isNewAnalysis) {
      const key = `${classifyAnonymousSource(analysis.attribution)}:${classifyAnonymousRole(analysis.report.document.perceivedRole)}`;
      store.anonymousRoleCounts.set(key, (store.anonymousRoleCounts.get(key) || 0) + 1);
    }
    return;
  }
  const { error: analysisError } = await client.from("analyses").insert({
    id: analysis.id, created_at: analysis.createdAt.toISOString(), updated_at: analysis.createdAt.toISOString(), status: analysis.status,
    locale: analysis.locale, market: analysis.market, attribution: analysis.attribution, target_role: analysis.report.document.targetRole, target_seniority: analysis.report.document.targetSeniority, job_description_present: analysis.plan === "job_match",
    parse_quality: "good", prompt_version: analysis.report.promptVersion, rubric_version: analysis.report.rubricVersion, review_model: analysis.model || process.env.OPENAI_REVIEW_MODEL,
    input_token_count: analysis.inputTokens ?? null, output_token_count: analysis.outputTokens ?? null, estimated_ai_cost: analysis.estimatedAiCost ?? null,
    access_token_hash: tokenHash, expires_at: analysis.expiresAt.toISOString(), paid_at: analysis.paid ? analysis.createdAt.toISOString() : null,
    completed_at: analysis.createdAt.toISOString(), duration_ms: analysis.durationMs ?? null,
    review_provenance: analysis.provenance ?? null,
    document_kind: analysis.documentKind ?? null,
    runtime_environment: runtimeEnvironmentFrom(),
    ...(analysis.accessCodeHash && analysis.accessCodeGrantedAt ? { access_code_hash: analysis.accessCodeHash, access_code_granted_at: analysis.accessCodeGrantedAt.toISOString() } : {}),
    ...(analysis.schoolGroupId ? { school_group_id: analysis.schoolGroupId, school_student_name: analysis.schoolStudentName } : {}),
  });
  if (analysisError) throw new Error("SUPABASE_SAVE_FAILED");
  const { error: reportError } = await client.from("reports").insert({ analysis_id: analysis.id, report_version: analysis.report.version, full_report_json: analysis.report });
  if (reportError) {
    await client.from("analyses").delete().eq("id", analysis.id);
    throw new Error("SUPABASE_SAVE_FAILED");
  }
}

export async function getAnalysis(token: string): Promise<Analysis | undefined> {
  return readAnalysis("access_token_hash", hashToken(token), token);
}

// Internal server read. Callers must authorize the analysis's school/group first.
export async function getAnalysisById(id: string): Promise<Analysis | undefined> {
  return readAnalysis("id", id);
}

async function readAnalysis(field: "id" | "access_token_hash", value: string, token?: string): Promise<Analysis | undefined> {
  const client = supabaseClient();
  if (!client) {
    if (token) return memoryGet(token);
    return [...store.analyses.values()].find(item => item.id === value && item.status === "complete" && item.expiresAt > new Date());
  }
  const { data, error } = await client.from("analyses")
    // Read optional new entitlement columns when present without breaking old
    // databases while codes are disabled. Only the whitelist below is returned.
    .select("*,reports(full_report_json),feedback(rating,accurate,issue_id,comment),payments(stripe_checkout_session_id,amount_gross,currency,plan,status,paid_at)")
    .eq(field, value).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("SUPABASE_READ_FAILED");
  if (!data) return undefined;
  const row = data as unknown as StoredAnalysisRow;
  const reportRelation = Array.isArray(row.reports) ? row.reports[0] : row.reports;
  if (!reportRelation) throw new Error("SUPABASE_READ_FAILED");
  const paidPayment = (row.payments || []).find((payment) => payment.status === "paid" && payment.stripe_checkout_session_id);
  return {
    id: row.id, createdAt: new Date(row.created_at), expiresAt: new Date(row.expires_at), tokenHash: row.access_token_hash,
    status: row.status, paid: Boolean(row.paid_at), plan: row.job_description_present ? "job_match" : "full_review",
    locale: row.locale, market: row.market, attribution: row.attribution || {}, durationMs: row.duration_ms || undefined,
    report: reportRelation.full_report_json,
    purchase: paidPayment ? { transactionId: paidPayment.stripe_checkout_session_id!, value: paidPayment.amount_gross / 100,
      currency: paidPayment.currency.toUpperCase(), plan: paidPayment.plan, paidAt: paidPayment.paid_at || undefined } : undefined,
    schoolGroupId: row.school_group_id, schoolStudentName: row.school_student_name, provenance: row.review_provenance, model: row.review_model,
    accessCodeHash: row.access_code_hash || undefined, accessCodeGrantedAt: row.access_code_granted_at ? new Date(row.access_code_granted_at) : undefined,
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

export async function grantReportCodeAccess(token: string, codeHash: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(codeHash)) return false;
  const item = await getAnalysis(token);
  if (!item || item.schoolGroupId) return false;
  if (hasReportCodeAccess(item)) return true;
  const client = supabaseClient();
  if (!client) { item.accessCodeHash = codeHash; item.accessCodeGrantedAt = new Date(); return true; }
  const { data, error } = await client.from("analyses").update({ access_code_hash: codeHash, access_code_granted_at: new Date().toISOString() })
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").is("school_group_id", null)
    .gt("expires_at", new Date().toISOString()).is("access_code_hash", null).select("id").maybeSingle();
  if (error) throw new Error("ACCESS_CODE_SAVE_FAILED");
  if (data) return true;
  const current = await getAnalysis(token);
  return Boolean(current && hasReportCodeAccess(current));
}

export async function savePendingPayment(payment: PendingPayment & { livemode: boolean }): Promise<void> {
  const client = supabaseClient();
  if (!client) return;
  const { error } = await client.from("payments").upsert({
    analysis_id: payment.analysisId,
    stripe_checkout_session_id: payment.checkoutSessionId,
    plan: payment.plan,
    amount_gross: payment.amountGross,
    currency: payment.currency.toLowerCase(),
    locale: payment.locale,
    market: payment.market,
    status: "pending",
    livemode: payment.livemode,
  }, { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true });
  if (error) throw new Error("SUPABASE_PAYMENT_SAVE_FAILED");
}

export async function fulfillStripePayment(payment: StripePayment): Promise<boolean> {
  const client = supabaseClient();
  if (!client) return false;
  const { data, error } = await client.rpc("fulfill_stripe_payment", {
    p_event_id: payment.eventId,
    p_analysis_id: payment.analysisId,
    p_checkout_session_id: payment.checkoutSessionId,
    p_payment_intent_id: payment.paymentIntentId,
    p_customer_id: payment.customerId,
    p_plan: payment.plan,
    p_amount_gross: payment.amountGross,
    p_currency: payment.currency.toLowerCase(),
  });
  if (error) throw new Error("SUPABASE_PAYMENT_UPDATE_FAILED");
  return Boolean(data);
}

export async function markStripePaymentTerminal(eventId: string, checkoutSessionId: string, status: "failed" | "refunded"): Promise<boolean> {
  const client = supabaseClient();
  if (!client) return false;
  const { data, error } = await client.rpc("mark_stripe_payment_terminal", {
    p_event_id: eventId,
    p_checkout_session_id: checkoutSessionId,
    p_status: status,
  });
  if (error) throw new Error("SUPABASE_PAYMENT_UPDATE_FAILED");
  return Boolean(data);
}

export async function addAnalysisFeedback(token: string, feedback: AnalysisFeedback, requestId?: string, version = 0): Promise<boolean> {
  const client = supabaseClient();
  if (!client) { const item = memoryGet(token); if (!item) return false;
    const existing = requestId ? item.feedback.find(row => row.submissionId === requestId) : undefined;
    if (existing) { if ((existing.reportVersion || 0) !== version || !sameFeedback(existing, feedback)) throw new FeedbackConflict(); return true; }
    item.feedback.push({ ...feedback, reportVersion: version, ...(requestId ? { submissionId: requestId } : {}) }); return true; }
  const { data: analysis, error: readError } = await client.from("analyses").select("id")
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (readError) throw new Error("SUPABASE_READ_FAILED");
  if (!analysis) return false;
  if (requestId) { await insertFeedbackOnce(client, analysis.id, feedback, requestId, version); return true; }
  const { error } = await client.from("feedback").insert({ analysis_id: analysis.id, rating: feedback.rating, accurate: feedback.accurate,
    issue_id: feedback.issueId || null, comment: feedback.comment || null });
  if (error) throw new Error("SUPABASE_UPDATE_FAILED");
  return true;
}

export async function deleteAnalysis(token: string): Promise<boolean> {
  const client = supabaseClient();
  if (!client) { const item = memoryGet(token); if (!item) return false; store.analyses.delete(item.tokenHash); store.revisions?.delete(item.id); return true; }
  const { data, error } = await client.from("analyses").delete().eq("access_token_hash", hashToken(token)).select("id").maybeSingle();
  if (error) throw new Error("SUPABASE_DELETE_FAILED");
  return Boolean(data);
}

export async function rotateAnalysisToken(currentToken: string, nextToken: string): Promise<boolean> {
  const client = supabaseClient();
  const currentHash = hashToken(currentToken);
  const nextHash = hashToken(nextToken);
  if (!client) {
    const item = memoryGet(currentToken);
    if (!item) return false;
    store.analyses.delete(currentHash);
    item.tokenHash = nextHash;
    store.analyses.set(nextHash, item);
    return true;
  }
  const { data, error } = await client.from("analyses").update({ access_token_hash: nextHash, updated_at: new Date().toISOString() })
    .eq("access_token_hash", currentHash).eq("status", "complete").gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
  if (error) throw new Error("SUPABASE_UPDATE_FAILED");
  return Boolean(data);
}

export async function cleanupExpired(now = new Date()): Promise<number> {
  const client = supabaseClient();
  if (!client) {
    let count = 0; for (const [key, item] of store.analyses) if (item.expiresAt <= now) { store.analyses.delete(key); store.revisions?.delete(item.id); count += 1; }
    return count;
  }
  const [analysesResult, quotaResult, schoolSessionsResult] = await Promise.all([
    client.from("analyses").delete({ count: "exact" }).lte("expires_at", now.toISOString()),
    client.from("analysis_rate_limits").delete().lte("expires_at", now.toISOString()),
    // Activate only after the school migration and Auth configuration are installed.
    ...(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
      ? [client.from("school_sessions").delete().lte("expires_at", now.toISOString())] : []),
  ]);
  if (analysesResult.error || quotaResult.error || schoolSessionsResult?.error) throw new Error("SUPABASE_DELETE_FAILED");
  return analysesResult.count || 0;
}

const funnelEventNames = new Set([
  "analysis_started", "analysis_succeeded", "analysis_failed", "teaser_viewed", "checkout_started",
  "checkout_cancelled", "checkout_expired", "payment_failed", "purchase", "full_report_viewed",
  "feedback_submitted", "delete_requested",
]);
const safePropertyKeys = new Set([
  "plan", "error_category", "unreadable_reason", "not_a_cv_reason", "analysis_success", "model", "prompt_version", "rubric_version", "duration_ms",
  "input_tokens", "output_tokens", "estimated_cost", "source", "medium", "campaign", "content", "term",
  "landing_variant", "broad_role_enum", "selected_seniority_enum", "handoff_origin", "teaser_variant", "currency", "value",
  "paid_click", "role_source", "detected_role_enum",
]);
const safePropertyEnums: Record<string, readonly string[]> = {
  plan: ["full_review", "job_match"],
  landing_variant: ["developer"],
  unreadable_reason: ["pdf_no_text_items", "pdf_empty_text_items", "pdf_page_extraction_failed", "pdf_parse_failed", "pdf_encrypted", "docx_no_text", "docx_parse_failed", "text_below_threshold"],
  not_a_cv_reason: ["too_short", "no_career_anchor", "insufficient_structure", "low_score"],
  broad_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform", "ai_llm_engineer", "ai_automation_specialist", "other"],
  detected_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform", "ai_llm_engineer", "ai_automation_specialist", "other"],
  role_source: ["autodetected", "user_chose", "not_detected", "detector_error", "not_run"],
  selected_seniority_enum: ["first_job", "auto", "junior", "mid", "senior", "lead"],
  handoff_origin: ["google_cpc", "other"],
  teaser_variant: ["evidence_v1"],
  currency: ["PLN", "EUR"],
};

export async function recordFunnelEvent(input: {
  name: string;
  locale: Locale;
  market: Market;
  analysisId?: string;
  paymentId?: string;
  dedupeKey?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}): Promise<void> {
  if (!funnelEventNames.has(input.name)) return;
  const safeProperties = Object.fromEntries(Object.entries(input.properties || {})
    .filter(([key, value]) => safePropertyKeys.has(key)
      && ["string", "number", "boolean"].includes(typeof value)
      && (!safePropertyEnums[key] || typeof value === "string" && safePropertyEnums[key].includes(value))));
  const client = supabaseClient();
  if (!client) {
    if (input.dedupeKey && store.eventDedupeKeys.has(input.dedupeKey)) return;
    if (input.dedupeKey) store.eventDedupeKeys.add(input.dedupeKey);
    store.events.push({ name: input.name, at: new Date() });
    return;
  }
  const { error } = await client.from("funnel_events").insert({
    analysis_id: input.analysisId || null,
    payment_id: input.paymentId || null,
    event_name: input.name,
    locale: input.locale,
    market: input.market,
    runtime_environment: runtimeEnvironmentFrom(),
    safe_properties: safeProperties,
    dedupe_key: input.dedupeKey || null,
  });
  // The dedupe index is partial (`where dedupe_key is not null`), so PostgREST
  // cannot target it with a plain `on_conflict=dedupe_key` upsert. Let the
  // database enforce uniqueness and treat only an expected duplicate as a
  // successful no-op. Events without a dedupe key must always be inserted.
  if (input.dedupeKey && error?.code === "23505") return;
  if (error) throw new Error("SUPABASE_EVENT_SAVE_FAILED");
}

export function track(name: string): void { store.events.push({ name, at: new Date() }); }

function summarizeFeedbackCounts(rows: Array<{ rating: number; accurate: string; response_count: number }>) {
  const count = rows.reduce((sum, item) => sum + Number(item.response_count || 0), 0);
  const weightedRating = rows.reduce((sum, item) => sum + item.rating * Number(item.response_count || 0), 0);
  return {
    count,
    averageRating: count ? Math.round(weightedRating / count * 100) / 100 : null,
    accuracy: Object.fromEntries(["yes", "partly", "no"].map((value) => [value,
      rows.filter((item) => item.accurate === value).reduce((sum, item) => sum + Number(item.response_count || 0), 0)])),
  };
}

/** Diagnostics windows are caller-supplied, so keep them to whole days inside the retention period. */
export function clampWindowDays(value: unknown): number {
  const days = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(days)) return 1;
  return Math.min(Math.max(Math.trunc(days), 1), 90);
}

/** Stripe sandbox testing writes real "paid" rows; only live-mode payments are real revenue. */
export function isRealPurchase(payment: { status: string; livemode: boolean }): boolean {
  return payment.status === "paid" && payment.livemode === true;
}

/**
 * Funnel events carry attribution for every visitor who reached the API, including those
 * who refused analytics cookies, so this mix is the consent-independent view of traffic.
 */
export function summarizeTrafficMix(
  events: Array<{ event_name: string; safe_properties: Record<string, unknown> | null }>,
  eventName = "analysis_started",
): { bySource: Record<string, number>; byMedium: Record<string, number>; paidClicks: number } {
  const relevant = events.filter((event) => event.event_name === eventName);
  const tally = (key: "source" | "medium") => {
    const values = relevant.map((event) => String(event.safe_properties?.[key] || "(direct)"));
    return Object.fromEntries([...new Set(values)].sort()
      .map((value) => [value, values.filter((candidate) => candidate === value).length]));
  };
  // A Google Ads click often lands with a click ID but no utm_medium=cpc, so it falls into
  // "(direct)" above. This counts it separately without needing source/medium to be present.
  const paidClicks = relevant.filter((event) => event.safe_properties?.paid_click === true).length;
  return { bySource: tally("source"), byMedium: tally("medium"), paidClicks };
}

export async function diagnostics(options: { windowDays?: number; runtimeEnvironment?: RuntimeEnvironment } = {}) {
  const windowDays = clampWindowDays(options.windowDays ?? 1);
  const runtimeEnvironment = options.runtimeEnvironment;
  const client = supabaseClient();
  if (client) {
    const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const analysesQuery = client.from("analyses").select("id,status,estimated_ai_cost,error_code,locale,market,prompt_version,rubric_version,review_model,review_provenance,attribution,job_description_present,runtime_environment").gte("created_at", since);
    const eventsQuery = client.from("funnel_events").select("event_name,locale,market,safe_properties").gte("occurred_at", since);
    if (runtimeEnvironment) {
      analysesQuery.eq("runtime_environment", runtimeEnvironment);
      eventsQuery.eq("runtime_environment", runtimeEnvironment);
    }
    const [{ data: analyses, error: analysesError }, { data: events, error: eventsError }, { data: payments, error: paymentsError }, { data: feedbackRows, error: feedbackError }, { data: feedbackAggregateRows, error: feedbackAggregateError }, { data: feedbackNoteRows, error: feedbackNotesError }, { data: anonymousRoleRows, error: anonymousRoleError }] = await Promise.all([
      analysesQuery,
      eventsQuery,
      client.from("payments").select("analysis_id,status,amount_gross,currency,plan,locale,market,livemode").gte("created_at", since),
      client.from("feedback").select("rating,accurate").gte("created_at", since),
      client.from("feedback_quality_aggregates").select("rating,accurate,response_count"),
      client.from("feedback_notes").select("rating,accurate,comment").gte("created_at", since).order("created_at", { ascending: false }),
      client.from("anonymous_role_aggregates").select("role_category,source_bucket,analysis_count"),
    ]);
    if (analysesError || eventsError || paymentsError || feedbackError || feedbackAggregateError || feedbackNotesError || anonymousRoleError) throw new Error("SUPABASE_DIAGNOSTICS_FAILED");
    const eventCounts = Object.fromEntries([...new Set((events || []).map((event) => event.event_name))]
      .map((name) => [name, (events || []).filter((event) => event.event_name === name).length]));
    const count = (name: string) => Number(eventCounts[name] || 0);
    const ratio = (numerator: number, denominator: number) => denominator ? Math.round(numerator / denominator * 10_000) / 100 : null;
    const analysisById = new Map((analyses || []).map((analysis) => [analysis.id, analysis]));
    const scopedPayments = (payments || []).filter((payment) => !runtimeEnvironment || analysisById.get(payment.analysis_id)?.runtime_environment === runtimeEnvironment);
    const paidPayments = scopedPayments.filter(isRealPurchase);
    const segmentCounts = (values: string[]) => Object.fromEntries([...new Set(values)].sort()
      .map((value) => [value, values.filter((candidate) => candidate === value).length]));
    const analysisSegment = (key: keyof Attribution, fallback: string) => (analyses || []).map((analysis) => {
      const attribution = analysis.attribution as Attribution | null;
      return String(attribution?.[key] || fallback);
    });
    const purchaseSegment = (key: keyof Attribution, fallback: string) => paidPayments.map((payment) => {
      const attribution = analysisById.get(payment.analysis_id)?.attribution as Attribution | null;
      return String(attribution?.[key] || fallback);
    });
    const revenueBySource = Object.fromEntries([...new Set(paidPayments.map((payment) => {
      const attribution = analysisById.get(payment.analysis_id)?.attribution as Attribution | null;
      return attribution?.source || "direct";
    }))].map((source) => [source, paidPayments.filter((payment) => {
      const attribution = analysisById.get(payment.analysis_id)?.attribution as Attribution | null;
      return (attribution?.source || "direct") === source;
    }).reduce((sum, payment) => sum + payment.amount_gross, 0) / 100]));
    const errorCategories = (events || []).filter((event) => event.event_name === "analysis_failed")
      .map((event) => String((event.safe_properties as Record<string, unknown> | null)?.error_category || "unknown"));
    return {
      windowDays,
      windowHours: windowDays * 24,
      runtimeEnvironment: runtimeEnvironment || "all",
      landingSessions: { value: null, sourceOfTruth: "GA4" },
      trafficMix: summarizeTrafficMix((events || []).map((event) => ({
        event_name: event.event_name,
        safe_properties: event.safe_properties as Record<string, unknown> | null,
      }))),
      analyses: analyses?.length || 0,
      failed: analyses?.filter((item) => item.status === "failed").length || 0,
      aiCost: (analyses || []).reduce((sum, item) => sum + Number(item.estimated_ai_cost || 0), 0),
      purchases: paidPayments.length,
      revenueByCurrency: Object.fromEntries(["pln", "eur"].map((currency) => [currency,
        paidPayments.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.amount_gross, 0) / 100])),
      revenueBySource,
      planSplit: Object.fromEntries(["full_review", "job_match"].map((plan) => [plan, paidPayments.filter((item) => item.plan === plan).length])),
      segments: {
        analyses: {
          landingVariant: segmentCounts(analysisSegment("landing_variant", "legacy_unknown")),
          role: segmentCounts(analysisSegment("broad_role_enum", "legacy_unknown")),
          seniority: segmentCounts(analysisSegment("selected_seniority_enum", "legacy_unknown")),
          plan: segmentCounts((analyses || []).map((analysis) => analysis.job_description_present ? "job_match" : "full_review")),
        },
        purchases: {
          landingVariant: segmentCounts(purchaseSegment("landing_variant", "legacy_unknown")),
          role: segmentCounts(purchaseSegment("broad_role_enum", "legacy_unknown")),
          seniority: segmentCounts(purchaseSegment("selected_seniority_enum", "legacy_unknown")),
          plan: segmentCounts(paidPayments.map((payment) => payment.plan)),
        },
      },
      conversionRatesPercent: {
        analysisSuccess: ratio(count("analysis_succeeded"), count("analysis_started")),
        teaserToCheckout: ratio(count("checkout_started"), count("teaser_viewed")),
        checkoutToPurchase: ratio(count("purchase"), count("checkout_started")),
      },
      // A missing version means the row predates the field, not a version named
      // "null". Label it legacy_unknown rather than inventing provenance.
      promptVersions: segmentCounts((analyses || []).map((item) => String(item.prompt_version || "legacy_unknown"))),
      rubricVersions: segmentCounts((analyses || []).map((item) => String(item.rubric_version || "legacy_unknown"))),
      // One row per distinct prompt/model/pipeline combination. Two reports are
      // only comparable when they share a line here.
      reviewProvenance: segmentCounts((analyses || []).map((item) => {
        const provenance = item.review_provenance as ReviewProvenance | null;
        if (!provenance) return "legacy_unknown";
        return `prompt=${provenance.promptVersion} variant=${provenance.promptVariant} model=${provenance.model} pipeline=${provenance.pipelineVersion}`;
      })),
      feedback: {
        last24Hours: { count: feedbackRows?.length || 0, averageRating: feedbackRows?.length ? Math.round(feedbackRows.reduce((sum, item) => sum + item.rating, 0) / feedbackRows.length * 100) / 100 : null,
          accuracy: Object.fromEntries(["yes", "partly", "no"].map((value) => [value, (feedbackRows || []).filter((item) => item.accurate === value).length])) },
        retainedAggregate: summarizeFeedbackCounts(feedbackAggregateRows || []),
        // Comments have a short, independent retention window so product
        // feedback can be reviewed after a report disappears. They carry no
        // analysis id, issue id, CV text or report content.
        recentComments: (feedbackNoteRows || [])
          .map((item) => ({ rating: item.rating, accurate: item.accurate, comment: String(item.comment || "").trim() }))
          .filter((item) => item.comment.length > 0)
          .slice(0, 50),
      },
      // Calibration is a prompt rule the models honour unevenly, so it is measured
      // rather than assumed. A rising count means the active prompt or model is
      // scoring categories above the cap its own issues imply.
      calibration: (() => {
        const violations = (analyses || []).flatMap((item) => {
          const provenance = item.review_provenance as ReviewProvenance | null;
          return provenance?.calibrationViolations || [];
        });
        return {
          analysesWithViolations: (analyses || []).filter((item) => ((item.review_provenance as ReviewProvenance | null)?.calibrationViolations || []).length > 0).length,
          analysesAudited: (analyses || []).filter((item) => Array.isArray((item.review_provenance as ReviewProvenance | null)?.calibrationViolations)).length,
          violationsByCategory: segmentCounts(violations.map((violation) => `${violation.category} (${violation.severity}, cap ${violation.cap})`)),
        };
      })(),
      anonymousAudienceRoles: summarizeAnonymousRoleStatistics((anonymousRoleRows || []) as AnonymousRoleAggregateRow[]),
      topErrorCategories: Object.fromEntries([...new Set(errorCategories)].map((category) => [category, errorCategories.filter((item) => item === category).length])),
      events: eventCounts,
    };
  }
  const values = [...store.analyses.values()];
  const anonymousRoleRows = [...store.anonymousRoleCounts.entries()].map(([key, analysis_count]) => {
    const [source_bucket, role_category] = key.split(":");
    return { source_bucket, role_category, analysis_count } as AnonymousRoleAggregateRow;
  });
  return { windowDays, analyses: values.length, completed: values.filter((v) => v.status === "complete").length, paid: values.filter((v) => v.paid).length,
    deleted: values.filter((v) => v.status === "deleted").length, feedback: values.reduce((sum, v) => sum + v.feedback.length, 0),
    anonymousAudienceRoles: summarizeAnonymousRoleStatistics(anonymousRoleRows),
    events: Object.fromEntries([...new Set(store.events.map((e) => e.name))].map((name) => [name, store.events.filter((e) => e.name === name).length])) };
}

export type Revision = { version: number; requestId: string; leaseId: string; leaseUntil: number; status: "running" | "complete"; report?: CVReport; createdAt: string };
export type RevisionSummary = Pick<Revision, "version" | "createdAt"> & { score: number };

export async function getReportRevisions(item: Analysis): Promise<Revision[]> {
  const client = supabaseClient();
  if (!client) return store.revisions!.get(item.id) || [];
  const { data, error } = await client.from("analysis_revisions").select("version,request_id,lease_id,lease_until,status,report,created_at").eq("analysis_id", item.id).order("version");
  if (error) throw new Error("REVISION_STORAGE_UNAVAILABLE");
  return (data || []).map(row => ({ version: row.version, requestId: row.request_id, leaseId: row.lease_id, leaseUntil: new Date(row.lease_until).getTime(), status: row.status, report: row.report || undefined, createdAt: row.created_at }));
}

export async function reserveReportRevision(token: string, requestId: string, leaseId: string, testAccess = false): Promise<{ version: number; status: "running" | "complete" }> {
  const client = supabaseClient();
  if (client) {
    const { data, error } = await client.rpc("reserve_report_revision", { p_token_hash: hashToken(token), p_request_id: requestId, p_lease_id: leaseId, p_test: testAccess });
    if (error) throw new Error(["REPORT_NOT_FOUND", "PAYMENT_REQUIRED", "REVISION_BUSY", "REVISION_LIMIT", "LEGACY_REPORT"].find(code => error.message.includes(code)) || "REVISION_STORAGE_UNAVAILABLE");
    return data;
  }
  const item = memoryGet(token);
  if (!item) throw new Error("REPORT_NOT_FOUND");
  if (!item.paid && !hasReportCodeAccess(item) && !testAccess) throw new Error("PAYMENT_REQUIRED");
  if (item.plan !== "full_review") throw new Error("LEGACY_REPORT");
  const rows = store.revisions!.get(item.id) || [];
  const completed = rows.find(row => row.requestId === requestId && row.status === "complete");
  if (completed) return { version: completed.version, status: "complete" };
  if (rows.some(row => row.status === "running" && row.leaseUntil > Date.now())) throw new Error("REVISION_BUSY");
  const retained = rows.filter(row => row.status === "complete");
  const version = [1,2].find(slot => !retained.some(row => row.version === slot));
  if (!version) throw new Error("REVISION_LIMIT");
  retained.push({ version, requestId, leaseId, leaseUntil: Date.now() + 480_000, status: "running", createdAt: new Date().toISOString() });
  store.revisions!.set(item.id, retained);
  return { version, status: "running" };
}

export async function finishReportRevision(token: string, leaseId: string, report: CVReport, provenance: ReviewProvenance | null, testAccess = false): Promise<boolean> {
  const client = supabaseClient();
  if (client) {
    const { data, error } = await client.rpc("complete_report_revision", { p_token_hash: hashToken(token), p_lease_id: leaseId, p_report: report, p_provenance: provenance, p_test: testAccess });
    if (error) throw new Error("REVISION_STORAGE_UNAVAILABLE");
    return Boolean(data);
  }
  const item = memoryGet(token);
  if (!item || (!item.paid && !hasReportCodeAccess(item) && !testAccess)) return false;
  const row = store.revisions!.get(item.id)?.find(row => row.leaseId === leaseId && row.status === "running" && row.leaseUntil > Date.now());
  if (!row) return false;
  Object.assign(row, { status: "complete", report, createdAt: new Date().toISOString() });
  return true;
}

export async function releaseReportRevision(token: string, leaseId: string): Promise<void> {
  const item = await getAnalysis(token);
  if (!item) return;
  const client = supabaseClient();
  if (client) {
    const { error } = await client.from("analysis_revisions").delete().eq("analysis_id", item.id).eq("lease_id", leaseId).eq("status", "running");
    if (error) throw new Error("REVISION_STORAGE_UNAVAILABLE");
  } else store.revisions!.set(item.id, (store.revisions!.get(item.id) || []).filter(row => row.leaseId !== leaseId || row.status === "complete"));
}
