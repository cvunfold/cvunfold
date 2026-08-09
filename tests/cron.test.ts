import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { GET } from "@/app/api/cron/retention/route";
import { getAnalysis, saveAnalysis } from "@/lib/data/store";
import { createMockReport } from "@/lib/ai/mock-report";
import { createAccessToken } from "@/lib/security/tokens";

describe("secured retention cron", () => {
  beforeEach(() => {
    process.env.MOCK_MODE = "true";
    process.env.CRON_SECRET = "cvunfold-cron-secret-for-tests";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects missing and incorrect authorization", async () => {
    expect((await GET(new Request("http://localhost/api/cron/retention"))).status).toBe(401);
    expect((await GET(new Request("http://localhost/api/cron/retention", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
  });

  it("deletes expired reports only with the configured bearer secret", async () => {
    const token = createAccessToken();
    await saveAnalysis(token, {
      id: randomUUID(), createdAt: new Date(Date.now() - 10_000), expiresAt: new Date(Date.now() - 1_000), status: "complete",
      paid: false, plan: "full_review", locale: "pl", market: "pl", attribution: {}, report: createMockReport(), feedback: [],
    });
    const response = await GET(new Request("http://localhost/api/cron/retention", {
      headers: { authorization: "Bearer cvunfold-cron-secret-for-tests" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: 1 });
    await expect(getAnalysis(token)).resolves.toBeUndefined();
  });
});
