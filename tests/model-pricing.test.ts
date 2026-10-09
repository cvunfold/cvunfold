import { afterEach, describe, expect, it } from "vitest";
import { estimateCostUsd, knownPricedModels, resolveModelPricing } from "@/lib/ai/model-pricing";

const originalInput = process.env.OPENAI_INPUT_COST_PER_MILLION;
const originalOutput = process.env.OPENAI_OUTPUT_COST_PER_MILLION;
afterEach(() => {
  for (const [name, value] of [["OPENAI_INPUT_COST_PER_MILLION", originalInput], ["OPENAI_OUTPUT_COST_PER_MILLION", originalOutput]] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("model pricing", () => {
  it.each([
    ["gpt-5.6-sol", 5, 30],
    ["gpt-5.6-terra", 2, 12],
    ["gpt-6-luna", 0.1, 0.5],
    ["gpt-5.6-luna", 0.2, 1.2],
    ["gpt-5.4-mini", 0.75, 4.5],
  ])("prices %s from the table", (model, input, output) => {
    const pricing = resolveModelPricing(model);
    expect(pricing).toMatchObject({ inputUsdPerMillion: input, outputUsdPerMillion: output, source: "table" });
  });

  it("prefers the table over a stale environment rate", () => {
    process.env.OPENAI_INPUT_COST_PER_MILLION = "2.5";
    process.env.OPENAI_OUTPUT_COST_PER_MILLION = "15";
    expect(resolveModelPricing("gpt-5.6-terra")).toMatchObject({ inputUsdPerMillion: 2, outputUsdPerMillion: 12, source: "table" });
  });

  it("falls back to the environment for a model missing from the table", () => {
    process.env.OPENAI_INPUT_COST_PER_MILLION = "2.5";
    process.env.OPENAI_OUTPUT_COST_PER_MILLION = "15";
    expect(resolveModelPricing("gpt-9-unreleased")).toMatchObject({ inputUsdPerMillion: 2.5, outputUsdPerMillion: 15, source: "env" });
  });

  it("reports unknown rather than guessing when nothing is configured", () => {
    delete process.env.OPENAI_INPUT_COST_PER_MILLION;
    delete process.env.OPENAI_OUTPUT_COST_PER_MILLION;
    expect(resolveModelPricing("gpt-9-unreleased").source).toBe("unknown");
    expect(estimateCostUsd("gpt-9-unreleased", 1000, 1000).cost).toBeNull();
  });

  it("computes the observed canary cost from the model that ran", () => {
    // The real 07:58 run: same CV, gpt-5.6-terra, 12 606 in / 4 175 out.
    expect(estimateCostUsd("gpt-5.6-terra", 12_606, 4_175).cost).toBeCloseTo(0.075312, 6);
    // The same tokens on the model previously used to price it were 3.3x off.
    expect(estimateCostUsd("gpt-5.4-mini", 12_606, 4_100).cost).toBeCloseTo(0.0279045, 6);
  });

  it("keeps every priced model addressable for the eval preflight", () => {
    expect(knownPricedModels()).toContain("gpt-5.6-terra");
  });
});
