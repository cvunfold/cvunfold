// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readConsent, writeConsent } from "@/lib/analytics/client";
import { captureLinkedInAttribution, readLinkedInClickId, trackLinkedInPurchase, LINKEDIN_CLICK_STORAGE_KEY } from "@/lib/analytics/linkedin-client";
import { LINKEDIN_CLICK_MAX_AGE_MS, MEASUREMENT_CONSENT_VERSION } from "@/lib/analytics/linkedin-shared";
const clickId = "12345678-1234-1234-1234-123456789abc";
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED", "true"); window.history.replaceState(null, "", `/?li_fat_id=${clickId}`); });
afterEach(() => { localStorage.clear(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

it("does not reuse Google-only consent or retain a click before the new permission", () => {
  localStorage.setItem("cv-review:google-consent:v1", "granted");
  expect(readConsent()).toBeNull(); captureLinkedInAttribution();
  expect(localStorage.getItem(LINKEDIN_CLICK_STORAGE_KEY)).toBeNull();
  writeConsent("granted"); captureLinkedInAttribution();
  expect(readLinkedInClickId()).toBe(clickId);
  writeConsent("denied"); captureLinkedInAttribution();
  expect(readLinkedInClickId()).toBeNull();
  expect(localStorage.getItem(LINKEDIN_CLICK_STORAGE_KEY)).toBeNull();
});
it("expires click attribution and does not collect IDs from private report URLs", () => {
  writeConsent("granted");
  localStorage.setItem(LINKEDIN_CLICK_STORAGE_KEY, JSON.stringify({ id: clickId, capturedAt: Date.now() - LINKEDIN_CLICK_MAX_AGE_MS - 1, consentVersion: MEASUREMENT_CONSENT_VERSION }));
  expect(readLinkedInClickId()).toBeNull();
  window.history.replaceState(null, "", `/raport/private?li_fat_id=${clickId}`);
  captureLinkedInAttribution(); expect(readLinkedInClickId()).toBeNull();
});
it("deduplicates accepted purchases independently of Google and retries failures", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 502 })).mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ sent: true }), { status: 200 })));
  vi.stubGlobal("fetch", fetch);
  writeConsent("granted"); captureLinkedInAttribution();
  await trackLinkedInPurchase("report-id", "cs_live_test");
  await trackLinkedInPurchase("report-id", "cs_live_test");
  await trackLinkedInPurchase("report-id", "cs_live_test");
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ clickId, consentVersion: MEASUREMENT_CONSENT_VERSION });
  expect(fetch.mock.calls[0][1].referrerPolicy).toBe("no-referrer");
});
it("sends nothing after consent withdrawal", async () => {
  writeConsent("granted"); captureLinkedInAttribution(); writeConsent("denied");
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  await trackLinkedInPurchase("report", "cs_live_test"); expect(fetch).not.toHaveBeenCalled();
});
