export const marketingAttributionKeys = ["source", "medium", "campaign", "content", "term"] as const;
export const clickAttributionKeys = ["gclid", "gbraid", "wbraid"] as const;

export type MarketingAttributionKey = (typeof marketingAttributionKeys)[number] | (typeof clickAttributionKeys)[number];
export type MarketingAttribution = Partial<Record<MarketingAttributionKey, string>>;

const safeValue = /^[\p{L}\p{N}._~+\- ]+$/u;
const queryKeyByProperty: Record<MarketingAttributionKey, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
  term: "utm_term",
  gclid: "gclid",
  gbraid: "gbraid",
  wbraid: "wbraid",
};

function sanitizeValue(key: MarketingAttributionKey, raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  const maxLength = clickAttributionKeys.includes(key as (typeof clickAttributionKeys)[number]) ? 200 : 160;
  return value && value.length <= maxLength && safeValue.test(value) ? value : undefined;
}

export function sanitizeMarketingAttribution(value: unknown): MarketingAttribution {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: MarketingAttribution = {};
  for (const key of [...marketingAttributionKeys, ...clickAttributionKeys]) {
    const safe = sanitizeValue(key, source[key]);
    if (safe) result[key] = safe;
  }
  return result;
}

export function marketingAttributionFromSearch(search: string): MarketingAttribution {
  const params = new URLSearchParams(search);
  return sanitizeMarketingAttribution(Object.fromEntries(
    Object.entries(queryKeyByProperty).map(([property, queryKey]) => [property, params.get(queryKey)]),
  ));
}

export function marketingAttributionToSearch(attribution: MarketingAttribution): string {
  const params = new URLSearchParams();
  for (const key of [...marketingAttributionKeys, ...clickAttributionKeys]) {
    const value = attribution[key];
    if (value) params.set(queryKeyByProperty[key], value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function googleCampaignFields(attribution: MarketingAttribution): Record<string, string> {
  return Object.fromEntries([
    ["campaign_source", attribution.source],
    ["campaign_medium", attribution.medium],
    ["campaign_name", attribution.campaign],
    ["campaign_content", attribution.content],
    ["campaign_term", attribution.term],
  ].filter((entry): entry is [string, string] => Boolean(entry[1])));
}
