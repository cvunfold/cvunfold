import { describe, expect, it } from "vitest";
import { consumeAnalysisQuota } from "@/lib/security/rate-limit";

describe("analysis quota", () => {
  it("stops repeated AI analyses after the configured hourly cap", async () => {
    const subject = "a".repeat(64);
    await expect(consumeAnalysisQuota(subject, 2, 3)).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    await expect(consumeAnalysisQuota(subject, 2, 3)).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    await expect(consumeAnalysisQuota(subject, 2, 3)).resolves.toEqual({ allowed: false, retryAfterSeconds: 3_600 });
  });
});
