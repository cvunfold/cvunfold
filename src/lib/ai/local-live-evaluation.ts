// Real model evaluations with mock storage are confined to a local dev server.
// This switch never changes paid access, storage or production behavior.
export function localLiveEvaluationEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.LOCAL_LIVE_EVALUATION !== "true" || env.MOCK_MODE !== "true"
    || env.NODE_ENV !== "development" || env.VERCEL || env.VERCEL_ENV || env.VERCEL_TARGET_ENV) return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL || "");
    return url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch { return false; }
}
