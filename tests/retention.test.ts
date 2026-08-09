import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { cleanupExpired, getAnalysis, saveAnalysis } from "@/lib/data/store";
import { createMockReport } from "@/lib/ai/mock-report";
import { createAccessToken } from "@/lib/security/tokens";

describe("report retention", () => {
  it("removes an expired report from the private store", async () => {
    const token = createAccessToken();
    await saveAnalysis(token, { id: randomUUID(), createdAt: new Date(Date.now() - 10000), expiresAt: new Date(Date.now() - 1000), status: "complete", paid: false, plan: "full_review", locale: "en", market: "en", attribution: {}, report: createMockReport("auto", false, "frontend_developer", "en"), feedback: [] });
    await cleanupExpired();
    await expect(getAnalysis(token)).resolves.toBeUndefined();
  });
});
