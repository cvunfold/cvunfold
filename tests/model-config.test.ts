import { describe, expect, it } from "vitest";
import { resolveReviewModel } from "@/lib/ai/model-config";

describe("single review model policy", () => {
  it.each([undefined, "", "   ", "gpt-6-luna", " gpt-6-luna "])("uses GPT-6 Luna for configuration %s", (configured) => {
    expect(resolveReviewModel({ OPENAI_REVIEW_MODEL: configured })).toBe("gpt-6-luna");
  });

  it.each(["gpt-5.6-luna", "gpt-6.1-sol", "gpt-6-astra", "unknown-model"])("rejects a stale or different model %s", (configured) => {
    expect(() => resolveReviewModel({ OPENAI_REVIEW_MODEL: configured })).toThrow("OPENAI_NOT_CONFIGURED");
  });
});
