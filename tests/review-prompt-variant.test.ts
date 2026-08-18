import { afterEach, describe, expect, it } from "vitest";
import { activePromptVariant, getReviewPrompt } from "@/lib/ai/prompts";
import { PL_RC_PROMPT_VERSION } from "@/lib/ai/prompts/review-pl-v1_6-rc1";
import { PROMPT_VERSION } from "@/lib/ai/prompts/review-pl-v3";
import { EN_PROMPT_VERSION } from "@/lib/ai/prompts/review-en-v1";

const original = process.env.CV_REVIEW_PROMPT_VARIANT;
afterEach(() => {
  if (original === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
  else process.env.CV_REVIEW_PROMPT_VARIANT = original;
});

describe("review prompt variant", () => {
  it("serves the stable prompt when no variant is configured", () => {
    delete process.env.CV_REVIEW_PROMPT_VARIANT;
    expect(activePromptVariant()).toBe("stable");
    expect(getReviewPrompt("pl").version).toBe(PROMPT_VERSION);
  });

  it("falls back to stable for an unknown variant rather than failing open", () => {
    process.env.CV_REVIEW_PROMPT_VARIANT = "not-a-variant";
    expect(activePromptVariant()).toBe("stable");
    expect(getReviewPrompt("pl").version).toBe(PROMPT_VERSION);
  });

  it("serves v1.6-rc1 for Polish when that variant is selected", () => {
    process.env.CV_REVIEW_PROMPT_VARIANT = "v1.6-rc1";
    const resolved = getReviewPrompt("pl");
    expect(resolved.variant).toBe("v1.6-rc1");
    expect(resolved.version).toBe("v1.6-rc1");
    expect(resolved.version).toBe(PL_RC_PROMPT_VERSION);
    expect(resolved.systemPrompt).not.toBe(getReviewPrompt("en").systemPrompt);
  });

  it("keeps English on its stable prompt so a canary isolates the Polish change", () => {
    process.env.CV_REVIEW_PROMPT_VARIANT = "v1.6-rc1";
    const resolved = getReviewPrompt("en");
    expect(resolved.variant).toBe("stable");
    expect(resolved.version).toBe(EN_PROMPT_VERSION);
  });

  it("reports a version distinct from the stable one so stored reports stay attributable", () => {
    expect(PL_RC_PROMPT_VERSION).not.toBe(PROMPT_VERSION);
  });
});
