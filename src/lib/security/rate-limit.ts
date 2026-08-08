const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => time > now - windowMs);
  if (recent.length >= limit) return false;
  recent.push(now); hits.set(key, recent); return true;
}
