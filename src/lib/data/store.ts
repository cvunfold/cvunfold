import { createClient } from "@supabase/supabase-js";
import type { CVReport } from "@/lib/ai/schemas/report";
import type { Attribution } from "@/lib/analytics/attribution";
import {
  classifyAnonymousRole,
  classifyAnonymousSource,
  summarizeAnonymousRoleStatistics,
  type AnonymousRoleAggregateRow,
} from "@/lib/analytics/anonymous-role-statistics";
import type { Locale } from "@/lib/i18n";
import type { Market, Plan } from "@/lib/plans";
import { hashToken } from "@/lib/security/tokens";

export type AnalysisFeedback = { rating: number; accurate: string; issueId?: string; comment?: string };
export type Analysis = {
  id: string; createdAt: Date; expiresAt: Date; tokenHash: string; status: "complete" | "deleted";
  paid: boolean; plan: Plan; locale: Locale; market: Market; attribution: Attribution;
  report: CVReport; feedback: AnalysisFeedback[]; durationMs?: number; purchase?: Purchase;
  model?: string; inputTokens?: number; outputTokens?: number; estimatedAiCost?: number | null;
};
export type Purchase = { transactionId: string; value: number; currency: string; plan: Plan };
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
};
type StoredAnalysisRow = {
  id: string; created_at: string; expires_at: string; access_token_hash: string; status: "complete" | "deleted";
  paid_at: string | null; job_description_present: boolean; locale: Locale; market: Market; attribution: Attribution | null; duration_ms: number | null;
  reports: { full_report_json: CVReport } | Array<{ full_report_json: CVReport }> | null;
  feedback: Array<{ rating: number; accurate: string; issue_id: string | null; comment: string | null }> | null;
  payments: Array<{ stripe_checkout_session_id: string | null; amount_gross: number; currency: string; plan: Plan; status: string; paid_at: string | null }> | null;
};

const globalStore = globalThis as typeof globalThis & { __cvunfold?: Store };
const store: Store = globalStore.__cvunfold ?? { analyses: new Map(), events: [], eventDedupeKeys: new Set(), anonymousRoleCounts: new Map() };
store.eventDedupeKeys ??= new Set();
store.anonymousRoleCounts ??= new Map();
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
  });
  if (analysisError) throw new Error("SUPABASE_SAVE_FAILED");
  const { error: reportError } = await client.from("reports").insert({ analysis_id: analysis.id, report_version: analysis.report.version, full_report_json: analysis.report });
  if (reportError) {
    await client.from("analyses").delete().eq("id", analysis.id);
    throw new Error("SUPABASE_SAVE_FAILED");
  }
}

export async function getAnalysis(token: string): Promise<Analysis | undefined> {
  const client = supabaseClient();
  if (!client) return memoryGet(token);
  const { data, error } = await client.from("analyses")
    .select("id,created_at,expires_at,access_token_hash,status,paid_at,job_description_present,locale,market,attribution,duration_ms,reports(full_report_json),feedback(rating,accurate,issue_id,comment),payments(stripe_checkout_session_id,amount_gross,currency,plan,status,paid_at)")
    .eq("access_token_hash", hashToken(token)).eq("status", "complete").gt("expires_at", new Date().toISOString()).maybeSingle();
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
      currency: paidPayment.currency.toUpperCase(), plan: paidPayment.plan } : undefined,
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
    let count = 0; for (const [key, item] of store.analyses) if (item.expiresAt <= now) { store.analyses.delete(key); count += 1; }
    return count;
  }
  const [analysesResult, quotaResult] = await Promise.all([
    client.from("analyses").delete({ count: "exact" }).lte("expires_at", now.toISOString()),
    client.from("analysis_rate_limits").delete().lte("expires_at", now.toISOString()),
  ]);
  if (analysesResult.error || quotaResult.error) throw new Error("SUPABASE_DELETE_FAILED");
  return analysesResult.count || 0;
}

const funnelEventNames = new Set([
  "analysis_started", "analysis_succeeded", "analysis_failed", "teaser_viewed", "checkout_started",
  "checkout_cancelled", "checkout_expired", "payment_failed", "purchase", "full_report_viewed",
  "feedback_submitted", "delete_requested",
]);
const safePropertyKeys = new Set([
  "plan", "error_category", "analysis_success", "model", "prompt_version", "rubric_version", "duration_ms",
  "input_tokens", "output_tokens", "estimated_cost", "source", "medium", "campaign", "content", "term",
  "landing_variant", "broad_role_enum", "selected_seniority_enum", "handoff_origin", "teaser_variant", "currency", "value",
]);
const safePropertyEnums: Record<string, readonly string[]> = {
  plan: ["full_review", "job_match"],
  landing_variant: ["developer"],
  broad_role_enum: ["frontend_developer", "backend_developer", "fullstack_developer", "mobile_developer", "qa_test_automation", "devops_platform", "other"],
  selected_seniority_enum: ["auto", "junior", "mid", "senior", "lead"],
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
): { bySource: Record<string, number>; byMedium: Record<string, number> } {
  const relevant = events.filter((event) => event.event_name === eventName);
  const tally = (key: "source" | "medium") => {
    const values = relevant.map((event) => String(event.safe_properties?.[key] || "(direct)"));
    return Object.fromEntries([...new Set(values)].sort()
      .map((value) => [value, values.filter((candidate) => candidate === value).length]));
  };
  return { bySource: tally("source"), byMedium: tally("medium") };
}

export async function diagnostics(options: { windowDays?: number } = {}) {
  const windowDays = clampWindowDays(options.windowDays ?? 1);
  const client = supabaseClient();
  if (client) {
    const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const [{ data: analyses, error: analysesError }, { data: events, error: eventsError }, { data: payments, error: paymentsError }, { data: feedbackRows, error: feedbackError }, { data: feedbackAggregateRows, error: feedbackAggregateError }, { data: anonymousRoleRows, error: anonymousRoleError }] = await Promise.all([
      client.from("analyses").select("id,status,estimated_ai_cost,error_code,locale,market,prompt_version,rubric_version,attribution,job_description_present").gte("created_at", since),
      client.from("funnel_events").select("event_name,locale,market,safe_properties").gte("occurred_at", since),
      client.from("payments").select("analysis_id,status,amount_gross,currency,plan,locale,market,livemode").gte("created_at", since),
      client.from("feedback").select("rating,accurate").gte("created_at", since),
      client.from("feedback_quality_aggregates").select("rating,accurate,response_count"),
      client.from("anonymous_role_aggregates").select("role_category,source_bucket,analysis_count"),
    ]);
    if (analysesError || eventsError || paymentsError || feedbackError || feedbackAggregateError || anonymousRoleError) throw new Error("SUPABASE_DIAGNOSTICS_FAILED");
    const eventCounts = Object.fromEntries([...new Set((events || []).map((event) => event.event_name))]
      .map((name) => [name, (events || []).filter((event) => event.event_name === name).length]));
    const count = (name: string) => Number(eventCounts[name] || 0);
    const ratio = (numerator: number, denominator: number) => denominator ? Math.round(numerator / denominator * 10_000) / 100 : null;
    const analysisById = new Map((analyses || []).map((analysis) => [analysis.id, analysis]));
    const paidPayments = (payments || []).filter(isRealPurchase);
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
      promptVersions: Object.fromEntries([...new Set((analyses || []).map((item) => item.prompt_version))].map((version) => [version, (analyses || []).filter((item) => item.prompt_version === version).length])),
      rubricVersions: Object.fromEntries([...new Set((analyses || []).map((item) => item.rubric_version))].map((version) => [version, (analyses || []).filter((item) => item.rubric_version === version).length])),
      feedback: {
        last24Hours: { count: feedbackRows?.length || 0, averageRating: feedbackRows?.length ? Math.round(feedbackRows.reduce((sum, item) => sum + item.rating, 0) / feedbackRows.length * 100) / 100 : null,
          accuracy: Object.fromEntries(["yes", "partly", "no"].map((value) => [value, (feedbackRows || []).filter((item) => item.accurate === value).length])) },
        retainedAggregate: summarizeFeedbackCounts(feedbackAggregateRows || []),
      },
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
