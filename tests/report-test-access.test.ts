import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as grantAccess } from "@/app/api/report/test-access/route";
import { GET as getReport } from "@/app/api/report/route";
import { createReportTestGrant, hasReportTestAccess, reportTestAccessEnabled, REPORT_TEST_ACCESS_COOKIE } from "@/lib/security/report-test-access";
import { createAccessToken } from "@/lib/security/tokens";
import { REPORT_SESSION_COOKIE } from "@/lib/security/report-session";
import { createMockReport } from "@/lib/ai/mock-report";
import { getAnalysis, saveAnalysis } from "@/lib/data/store";

const code = "bootcamp";
const secret = "synthetic-signing-secret-only-not-a-deployment-secret";
let token: string;
let cookie: string;
beforeEach(async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_TARGET_ENV", "preview");
  vi.stubEnv("REPORT_TEST_ACCESS_ENABLED", "true");
  vi.stubEnv("REPORT_TEST_ACCESS_CODE", code);
  vi.stubEnv("REPORT_TEST_ACCESS_SECRET", secret);
  vi.stubEnv("MOCK_MODE", "true");
  token = createAccessToken(); cookie = `${REPORT_SESSION_COOKIE}=${token}`;
  await saveAnalysis(token, { id: randomUUID(), createdAt: new Date(), expiresAt: new Date(Date.now() + 3600_000), status: "complete", paid: false, plan: "full_review", locale: "pl", market: "pl", attribution: {}, report: createMockReport(), feedback: [] });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
const request = (submitted: string, session = cookie) => new Request("https://preview.example/api/report/test-access", { method: "POST", headers: { cookie: session, "Content-Type": "application/json" }, body: JSON.stringify({ code: submitted }) });

describe("preview test access boundary", () => {
  it("grants full access without a paid flag, transaction or purchase", async () => {
    const response = await grantAccess(request(code));
    expect(response.status).toBe(200);
    const grantCookie = response.headers.get("set-cookie")!.split(";")[0];
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    expect(response.headers.get("set-cookie")).not.toContain(code);
    const body = await (await getReport(new Request("https://preview.example/api/report", { headers: { cookie: `${cookie}; ${grantCookie}` } }))).json();
    expect(body).toMatchObject({ paid: false, fullAccess: true, accessMode: "preview_test" });
    expect(body.report).toHaveProperty("issues");
    expect(body.purchase).toBeUndefined();
    expect((await getAnalysis(token))?.paid).toBe(false);
    const unpaid = await (await getReport(new Request("https://preview.example/api/report", { headers: { cookie } }))).json();
    expect(unpaid.report).not.toHaveProperty("issues");
  });

  it("fails closed on production, unknown deployed environments and missing configuration", async () => {
    for (const environment of ["production", "unknown", "development"]) {
      vi.stubEnv("VERCEL_ENV", environment);
      expect(reportTestAccessEnabled()).toBe(false);
      expect((await grantAccess(request(code))).status).toBe(404);
    }
    vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL_TARGET_ENV", "production");
    expect(reportTestAccessEnabled()).toBe(false);
    vi.stubEnv("VERCEL_TARGET_ENV", "preview"); vi.stubEnv("REPORT_TEST_ACCESS_ENABLED", "false");
    expect(reportTestAccessEnabled()).toBe(false);
    vi.stubEnv("REPORT_TEST_ACCESS_ENABLED", "true"); vi.stubEnv("REPORT_TEST_ACCESS_CODE", "x");
    expect(reportTestAccessEnabled()).toBe(false);
    vi.stubEnv("REPORT_TEST_ACCESS_CODE", code); vi.stubEnv("REPORT_TEST_ACCESS_SECRET", "");
    expect(reportTestAccessEnabled()).toBe(false);
  });

  it("rejects a wrong code, missing report session and cross-origin submission", async () => {
    expect((await grantAccess(request("wrong"))).status).toBe(403);
    expect((await grantAccess(request(code, ""))).status).toBe(401);
    const crossOrigin = request(code); crossOrigin.headers.set("origin", "https://attacker.example");
    expect((await grantAccess(crossOrigin)).status).toBe(403);
    const local = new Request("http://localhost:3107/api/report/test-access", { method: "POST", headers: { cookie, host: "127.0.0.1:3107", origin: "http://127.0.0.1:3107", "x-report-test-code": code } });
    expect((await grantAccess(local)).status).toBe(200);
  });

  it("binds the signed grant to one report and rejects tampering, expiry and rotation", () => {
    const grant = createReportTestGrant(token, new Date(Date.now() + 3600_000));
    const authRequest = new Request("https://preview.example/api/report", { headers: { cookie: `${REPORT_TEST_ACCESS_COOKIE}=${grant}` } });
    expect(hasReportTestAccess(authRequest, token)).toBe(true);
    expect(hasReportTestAccess(authRequest, createAccessToken())).toBe(false);
    expect(hasReportTestAccess(new Request(authRequest.url, { headers: { cookie: `${REPORT_TEST_ACCESS_COOKIE}=${grant}x` } }), token)).toBe(false);
    vi.stubEnv("REPORT_TEST_ACCESS_CODE", `${code}-rotated`);
    expect(hasReportTestAccess(authRequest, token)).toBe(false);
    vi.stubEnv("REPORT_TEST_ACCESS_CODE", code);
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 31 * 60_000);
    expect(hasReportTestAccess(authRequest, token)).toBe(false);
  });

  it("revokes existing grants if the runtime becomes production", () => {
    const grant = createReportTestGrant(token, new Date(Date.now() + 3600_000));
    vi.stubEnv("VERCEL_ENV", "production");
    expect(hasReportTestAccess(new Request("https://prod.example/api/report", { headers: { cookie: `${REPORT_TEST_ACCESS_COOKIE}=${grant}` } }), token)).toBe(false);
  });

  it("limits repeated guesses against a report", async () => {
    for (let i = 0; i < 5; i++) expect((await grantAccess(request("wrong"))).status).toBe(403);
    expect((await grantAccess(request(code))).status).toBe(429);
  });

  it("accepts the automation header without leaking the code in the response", async () => {
    const response = await grantAccess(new Request("https://preview.example/api/report/test-access", { method: "POST", headers: { cookie, "x-report-test-code": code } }));
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(code);
  });
});
