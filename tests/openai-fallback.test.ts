import { describe, expect, it } from "vitest";
import { isRetryableOpenAIError } from "@/lib/ai/openai-review";

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
