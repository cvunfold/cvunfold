// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureAdsPurchaseDestination,
  flushPendingAnalytics,
  markAnalyticsReady,
  resetAnalyticsReady,
  trackPurchaseConversion,
  writeConsent,
} from "@/lib/analytics/client";
import { googleConsentDefaults } from "@/components/google-analytics";

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  configureAdsPurchaseDestination();
  resetAnalyticsReady();
  delete window.gtag;
});

describe("purchase measurement boundary", () => {
  it("emits a confirmed purchase and Ads conversion once per transaction in the browser", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    writeConsent("granted");
    configureAdsPurchaseDestination("AW-123456789/abc-DEF_12");
    markAnalyticsReady();
    const purchase = { transactionId: "cs_test_unique", value: 29, currency: "PLN", plan: "full_review" as const, locale: "pl" as const, market: "pl" as const };
    trackPurchaseConversion(purchase);
    trackPurchaseConversion(purchase);
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({ transaction_id: "cs_test_unique", value: 29, currency: "PLN" }));
    expect(gtag).toHaveBeenCalledWith("event", "conversion", expect.objectContaining({ send_to: "AW-123456789/abc-DEF_12", transaction_id: "cs_test_unique" }));
  });

  it("ignores an invalid Ads destination", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    writeConsent("granted");
    configureAdsPurchaseDestination("attacker.example/label");
    markAnalyticsReady();
    trackPurchaseConversion({ transactionId: "cs_test_no_ads", value: 12, currency: "EUR", plan: "job_match", locale: "en", market: "en" });
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).not.toHaveBeenCalledWith("event", "conversion", expect.anything());
  });

  it("does not mark a purchase as sent before the privacy-safe tag configuration is ready", () => {
    writeConsent("granted");
    const purchase = { transactionId: "cs_test_delayed", value: 29, currency: "PLN", plan: "full_review" as const, locale: "pl" as const, market: "pl" as const };
    trackPurchaseConversion(purchase);
    expect(window.localStorage.getItem("cv-review:purchase:cs_test_delayed:v1")).toBeNull();

    const gtag = vi.fn();
    window.gtag = gtag;
    markAnalyticsReady();
    flushPendingAnalytics();
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({ transaction_id: "cs_test_delayed" }));
    expect(window.localStorage.getItem("cv-review:purchase:cs_test_delayed:v1")).toBe("1");
  });
});

describe("Google tag bootstrap", () => {
  it("initializes gtag.js after applying denied consent defaults", () => {
    const consentDefault = googleConsentDefaults.indexOf("gtag('consent', 'default'");
    const tagInitialization = googleConsentDefaults.indexOf("gtag('js', new Date())");

    expect(consentDefault).toBeGreaterThan(-1);
    expect(tagInitialization).toBeGreaterThan(consentDefault);
  });
});
