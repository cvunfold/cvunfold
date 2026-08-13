import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createMockReport } from "@/lib/ai/mock-report";
import { diagnostics, saveAnalysis } from "@/lib/data/store";
import { createAccessToken } from "@/lib/security/tokens";
import { POST as createSession } from "@/app/api/report-session/route";
import { GET as getReport, DELETE as deleteReport } from "@/app/api/report/route";
import { POST as checkout } from "@/app/api/report/checkout/route";

describe("private report API boundary", () => {
  let token = "";
  let cookie = "";

  beforeEach(async () => {
    process.env.MOCK_MODE = "true";
    token = createAccessToken();
    await saveAnalysis(token, {
      id: randomUUID(), createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000), status: "complete",
      paid: false, plan: "full_review", locale: "pl", market: "pl", attribution: {}, report: createMockReport(), feedback: [],
    });
    const session = await createSession(new Request("http://localhost/api/report-session", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    }));
    expect(session.status).toBe(200);
    cookie = session.headers.get("set-cookie") || "";
    expect(cookie).toContain("HttpOnly");
  });

  it("returns only the teaser before server-side payment confirmation", async () => {
    const response = await getReport(new Request("http://localhost/api/report", { headers: { cookie } }));
    const payload = await response.json();
    expect(payload.paid).toBe(false);
    expect(payload.report).not.toHaveProperty("issues");
    expect(payload.report).not.toHaveProperty("strengths");
    expect(JSON.stringify(payload.report)).not.toContain("full_report_json");
  });

  it("deduplicates repeated teaser reads for the server funnel", async () => {
    const before = await diagnostics();
    await getReport(new Request("http://localhost/api/report", { headers: { cookie } }));
    await getReport(new Request("http://localhost/api/report", { headers: { cookie } }));
    const after = await diagnostics();
    expect(Number(after.events.teaser_viewed || 0) - Number(before.events.teaser_viewed || 0)).toBe(1);
  });

  it("unlocks only after the server marks the analysis paid", async () => {
    const payment = await checkout(new Request("http://localhost/api/report/checkout", { method: "POST", headers: { cookie } }));
    expect(payment.status).toBe(200);
    const response = await getReport(new Request("http://localhost/api/report", { headers: { cookie } }));
    const payload = await response.json();
    expect(payload.paid).toBe(true);
    expect(payload.report.issues.length).toBeGreaterThan(0);
  });

  it("deletes the report and rejects subsequent access", async () => {
    expect((await deleteReport(new Request("http://localhost/api/report", { method: "DELETE", headers: { cookie } }))).status).toBe(204);
    expect((await getReport(new Request("http://localhost/api/report", { headers: { cookie } }))).status).toBe(404);
  });
});
