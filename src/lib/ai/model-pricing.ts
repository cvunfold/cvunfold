export type ModelRate = { inputUsdPerMillion: number; outputUsdPerMillion: number };
export type PricingSource = "table" | "env" | "unknown";
export type ResolvedPricing = ModelRate & { source: PricingSource };

// USD per 1M tokens. Cost has to follow the model that actually ran: a single
// shared rate pair misprices every run after a model swap, and prices a fallback
// run at the primary model's rate. Both happened before this table existed.
const MODEL_PRICING: Record<string, ModelRate> = {
  "gpt-5.6-sol": { inputUsdPerMillion: 5, outputUsdPerMillion: 30 },
  "gpt-5.6-terra": { inputUsdPerMillion: 2, outputUsdPerMillion: 12 },
  "gpt-6-luna": { inputUsdPerMillion: 0.1, outputUsdPerMillion: 0.5 },
  "gpt-5.6-luna": { inputUsdPerMillion: 0.2, outputUsdPerMillion: 1.2 },
  "gpt-5.4-mini": { inputUsdPerMillion: 0.75, outputUsdPerMillion: 4.5 },
};

function envRate(name: string): number | null {
  const raw = process.env[name];
  const value = Number(raw);
  return raw && Number.isFinite(value) && value >= 0 ? value : null;
}

// The table wins over the environment: a rate configured for a previous model
// is worse than no rate at all, because it looks authoritative.
export function resolveModelPricing(model: string): ResolvedPricing {
  const known = MODEL_PRICING[model.trim()];
  if (known) return { ...known, source: "table" };
  const input = envRate("OPENAI_INPUT_COST_PER_MILLION");
  const output = envRate("OPENAI_OUTPUT_COST_PER_MILLION");
  if (input !== null && output !== null) return { inputUsdPerMillion: input, outputUsdPerMillion: output, source: "env" };
  return { inputUsdPerMillion: 0, outputUsdPerMillion: 0, source: "unknown" };
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): { cost: number | null; pricing: ResolvedPricing } {
  const pricing = resolveModelPricing(model);
  if (pricing.source === "unknown") return { cost: null, pricing };
  return { cost: (inputTokens * pricing.inputUsdPerMillion + outputTokens * pricing.outputUsdPerMillion) / 1_000_000, pricing };
}

export function knownPricedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}
