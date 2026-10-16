import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { linkedInConversionsConfigured, linkedInPurchasePayload, sendLinkedInPurchase } from "@/lib/analytics/linkedin-server";
import { MEASUREMENT_CONSENT_VERSION } from "@/lib/analytics/linkedin-shared";
import type { Analysis, Purchase } from "@/lib/data/store";

const clickId = "12345678-1234-1234-1234-123456789abc";
const purchase: Purchase = { transactionId: "cs_live_synthetic", value: 59, currency: "PLN", plan: "full_review", paidAt: new Date(Date.now() - 60_000).toISOString() };
const { getAnalysis, hasReportTestAccess } = vi.hoisted(() => ({ getAnalysis: vi.fn(), hasReportTestAccess: vi.fn(() => false) }));
vi.mock("@/lib/data/store", () => ({ getAnalysis }));
vi.mock("@/lib/security/report-test-access", () => ({ hasReportTestAccess }));
import { POST } from "@/app/api/report/linkedin-purchase/route";

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("MOCK_MODE", "false");
  vi.stubEnv("NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED", "true");
  vi.stubEnv("LINKEDIN_PURCHASE_CONVERSION_ID", "29626524");
  vi.stubEnv("LINKEDIN_CONVERSIONS_ACCESS_TOKEN", "synthetic-test-token");
  hasReportTestAccess.mockReturnValue(false);
  getAnalysis.mockResolvedValue({ id: "11111111-1111-1111-1111-111111111111", paid: true, purchase } as Analysis);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("LinkedIn purchase boundary", () => {
  it("sends only the click and verified payment with stable deduplication", () => {
    const payload = linkedInPurchasePayload(purchase, clickId, "29626524")!;
    expect(payload.conversionValue).toEqual({ amount: "59.00", currencyCode: "PLN" });
    expect(payload.conversionHappenedAt).toBe(Date.parse(purchase.paidAt!));
    expect(payload.user).toEqual({ userIds: [{ idType: "LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID", idValue: clickId }] });
    expect(payload.eventId).toMatch(/^[a-f0-9]{64}$/);
    expect(linkedInPurchasePayload(purchase, clickId, "29626524")?.eventId).toBe(payload.eventId);
    expect(JSON.stringify(payload)).not.toMatch(/cs_live_|report|email|ipAddress|analysisId|plan/);
    expect(linkedInPurchasePayload({ ...purchase, currency: "EUR", value: 19 }, clickId, "29626524")?.conversionValue).toEqual({ amount: "19.00", currencyCode: "EUR" });
  });
  it.each([
    { transactionId: "cs_test_test" }, { value: 0 }, { value: NaN }, { paidAt: undefined },
    { paidAt: new Date(Date.now() + 86_400_000).toISOString() },
    { paidAt: new Date(Date.now() - 91 * 86_400_000).toISOString() },
  ])("rejects non-live, missing or invalid payments: %j", change => {
    expect(linkedInPurchasePayload({ ...purchase, ...change }, clickId, "29626524")).toBeNull();
  });
  it("does not enable delivery in preview or mock environments", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(linkedInConversionsConfigured()).toBe(false);
    await expect(sendLinkedInPurchase(purchase, clickId)).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  let sequence = 0;
  function request(options: { body?: unknown; origin?: string; cookie?: boolean; id?: string } = {}) {
    sequence += 1;
    return new Request("https://cvunfold.com/api/report/linkedin-purchase", {
      method: "POST", headers: {
        origin: options.origin ?? "https://cvunfold.com", "Content-Type": "application/json",
        ...(options.cookie === false ? {} : { cookie: `cv_review_report_session_v1=${String(sequence).padStart(43, "a")}` }),
        "x-report-id": options.id ?? "11111111-1111-1111-1111-111111111111",
      }, body: JSON.stringify(options.body ?? { clickId, consentVersion: MEASUREMENT_CONSENT_VERSION }),
    });
  }
  it("takes the amount and currency from the private server record, ignoring browser claims", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 })); vi.stubGlobal("fetch", fetch);
    const response = await POST(request({ body: { clickId, consentVersion: MEASUREMENT_CONSENT_VERSION, amount: 999, currency: "USD" } }));
    expect(await response.json()).toEqual({ sent: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.conversionValue).toEqual({ amount: "59.00", currencyCode: "PLN" });
  });
  it.each([{ paid: false }, { purchase: undefined }, { schoolGroupId: "school" }])("does not count unpaid, free or school access: %j", async change => {
    getAnalysis.mockResolvedValue({ id: "11111111-1111-1111-1111-111111111111", paid: true, purchase, ...change });
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await (await POST(request())).json()).toEqual({ sent: false });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests, missing consent and the wrong report", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await POST(request({ origin: "https://example.org" }))).status).toBe(403);
    expect((await POST(request({ cookie: false }))).status).toBe(401);
    expect((await POST(request({ body: { clickId } }))).status).toBe(400);
    expect((await POST(request({ id: "22222222-2222-2222-2222-222222222222" }))).status).toBe(404);
    hasReportTestAccess.mockReturnValue(true);
    expect(await (await POST(request())).json()).toEqual({ sent: false });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("leaves failed delivery retryable without returning identifiers or provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive response", { status: 429 })));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ sent: false });
  });
});
