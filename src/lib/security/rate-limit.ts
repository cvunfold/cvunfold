import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const hits = new Map<string, number[]>();
const quotaHits = new Map<string, number[]>();
let quotaClient: SupabaseClient | null | undefined;

export type QuotaDecision = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => time > now - windowMs);
  if (recent.length >= limit) return false;
  recent.push(now); hits.set(key, recent); return true;
}

function memoryQuota(key: string, hourlyLimit: number, dailyLimit: number): QuotaDecision {
  const now = Date.now();
  const daily = (quotaHits.get(key) || []).filter((time) => time > now - 86_400_000);
  const hourly = daily.filter((time) => time > now - 3_600_000);
  if (daily.length >= dailyLimit) return { allowed: false, retryAfterSeconds: 86_400 };
  if (hourly.length >= hourlyLimit) return { allowed: false, retryAfterSeconds: 3_600 };
  daily.push(now);
  quotaHits.set(key, daily);
  return { allowed: true, retryAfterSeconds: 0 };
}

function getQuotaClient(): SupabaseClient | null {
  if (process.env.MOCK_MODE === "true" || process.env.NODE_ENV === "test") return null;
  if (quotaClient !== undefined) return quotaClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("RATE_LIMIT_CHECK_FAILED");
  quotaClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return quotaClient;
}

export async function consumeAnalysisQuota(
  subjectHash: string,
  hourlyLimit = Number(process.env.ANALYSIS_RATE_LIMIT_HOURLY || 3),
  dailyLimit = Number(process.env.ANALYSIS_RATE_LIMIT_DAILY || 10),
): Promise<QuotaDecision> {
  const client = getQuotaClient();
  if (!client) return memoryQuota(subjectHash, hourlyLimit, dailyLimit);
  const { data, error } = await client.rpc("consume_analysis_quota", {
    p_subject_hash: subjectHash,
    p_hour_limit: hourlyLimit,
    p_day_limit: dailyLimit,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row || typeof row.allowed !== "boolean") throw new Error("RATE_LIMIT_CHECK_FAILED");
  return { allowed: row.allowed, retryAfterSeconds: Number(row.retry_after_seconds || 0) };
}
