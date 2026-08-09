// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureAdsPurchaseDestination, trackPurchaseConversion, writeConsent } from "@/lib/analytics/client";

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  configureAdsPurchaseDestination();
  delete window.gtag;
});

describe("purchase measurement boundary", () => {
  it("emits a confirmed purchase and Ads conversion once per transaction in the browser", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    writeConsent("granted");
    configureAdsPurchaseDestination("AW-123456789/abc-DEF_12");
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
    trackPurchaseConversion({ transactionId: "cs_test_no_ads", value: 12, currency: "EUR", plan: "job_match", locale: "en", market: "en" });
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).not.toHaveBeenCalledWith("event", "conversion", expect.anything());
  });
});

