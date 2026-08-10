import { describe, expect, it } from "vitest";
import { getSafeOpenAIErrorDiagnostic, isRetryableOpenAIError, toSafeOpenAIErrorCode } from "@/lib/ai/openai-review";

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
