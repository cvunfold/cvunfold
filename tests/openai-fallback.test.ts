import { afterEach, describe, expect, it } from "vitest";
import { fallbackModelDisabled, getSafeOpenAIErrorDiagnostic, isRetryableOpenAIError, resolveReviewTimeoutMs, toSafeOpenAIErrorCode } from "@/lib/ai/openai-review";

describe("review request configuration", () => {
  const originalTimeout = process.env.OPENAI_REVIEW_TIMEOUT_MS;
  const originalDisable = process.env.OPENAI_REVIEW_DISABLE_FALLBACK;
  afterEach(() => {
    if (originalTimeout === undefined) delete process.env.OPENAI_REVIEW_TIMEOUT_MS;
    else process.env.OPENAI_REVIEW_TIMEOUT_MS = originalTimeout;
    if (originalDisable === undefined) delete process.env.OPENAI_REVIEW_DISABLE_FALLBACK;
    else process.env.OPENAI_REVIEW_DISABLE_FALLBACK = originalDisable;
  });

  it("defaults to the 90s timeout when unset", () => {
    delete process.env.OPENAI_REVIEW_TIMEOUT_MS;
    expect(resolveReviewTimeoutMs()).toBe(90_000);
  });

  it("accepts a longer timeout for a slower model", () => {
    process.env.OPENAI_REVIEW_TIMEOUT_MS = "180000";
    expect(resolveReviewTimeoutMs()).toBe(180_000);
  });

  it.each(["0", "1000", "600000", "abc", ""])("ignores the unusable timeout %s", (value) => {
    process.env.OPENAI_REVIEW_TIMEOUT_MS = value;
    expect(resolveReviewTimeoutMs()).toBe(90_000);
  });

  it("keeps the fallback model enabled unless explicitly disabled", () => {
    delete process.env.OPENAI_REVIEW_DISABLE_FALLBACK;
    expect(fallbackModelDisabled()).toBe(false);
    process.env.OPENAI_REVIEW_DISABLE_FALLBACK = "false";
    expect(fallbackModelDisabled()).toBe(false);
    process.env.OPENAI_REVIEW_DISABLE_FALLBACK = "true";
    expect(fallbackModelDisabled()).toBe(true);
  });
});

describe("OpenAI fallback boundary", () => {
  it.each([408, 409, 429, 500, 502, 503, 504, 520])("allows fallback for transient status %s", (status) => {
    expect(isRetryableOpenAIError({ status })).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])("does not hide permanent status %s behind fallback", (status) => {
    expect(isRetryableOpenAIError({ status })).toBe(false);
  });

  it("allows fallback for connection and timeout errors", () => {
    expect(isRetryableOpenAIError({ name: "APIConnectionError" })).toBe(true);
    expect(isRetryableOpenAIError({ name: "APITimeoutError" })).toBe(true);
  });
});

describe("OpenAI error sanitization", () => {
  it.each([
    { status: 401 },
    { status: 403 },
    { code: "invalid_api_key" },
    { name: "AuthenticationError" },
  ])("classifies authentication failures without exposing the provider message", (error) => {
    expect(toSafeOpenAIErrorCode(error)).toBe("OPENAI_AUTH_FAILED");
  });

  it.each([
    { status: 429 },
    { code: "rate_limit_exceeded" },
    { code: "insufficient_quota" },
  ])("classifies OpenAI capacity failures", (error) => {
    expect(toSafeOpenAIErrorCode(error)).toBe("OPENAI_RATE_LIMITED");
  });

  it("does not reinterpret unrelated application errors", () => {
    expect(toSafeOpenAIErrorCode(new Error("OPENAI_INVALID_RESPONSE"))).toBeNull();
  });

  it("keeps only allowlisted technical fields in diagnostics", () => {
    expect(getSafeOpenAIErrorDiagnostic({
      status: 400,
      code: "invalid_model",
      type: "invalid_request_error",
      name: "BadRequestError",
      message: "private CV content",
    })).toEqual({ status: 400, code: "invalid_model", type: "invalid_request_error", name: "BadRequestError" });
  });
});
