// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureAdsPurchaseDestination,
  clearPendingAnalytics,
  flushPendingAnalytics,
  markAnalyticsReady,
  readSafeAttribution,
  resetAnalyticsReady,
  safeAnalyticsLocation,
  trackAnalyticsEvent,
  trackPurchaseConversion,
  writeConsent,
} from "@/lib/analytics/client";
import { googleConsentDefaults } from "@/components/google-analytics";
import { safeAnalyticsPayload } from "@/lib/analytics/events";

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  configureAdsPurchaseDestination();
  clearPendingAnalytics();
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

describe("campaign attribution", () => {
  it("keeps only validated campaign parameters in a public GA4 page location", () => {
    const search = "?utm_source=google&utm_medium=cpc&utm_campaign=cv_developer_pl_search&utm_term=senior+frontend&gclid=abc_DEF-123&private=secret&utm_content=bad%40email.pl";
    expect(safeAnalyticsLocation("/", "https://cvunfold.com/", search)).toBe(
      "https://cvunfold.com/?utm_source=google&utm_medium=cpc&utm_campaign=cv_developer_pl_search&utm_term=senior+frontend&gclid=abc_DEF-123",
    );
  });

  it("never adds campaign or click parameters to a private report location", () => {
    expect(safeAnalyticsLocation("/raport", "https://cvunfold.com", "?utm_source=google&gclid=abc-123&session_id=secret"))
      .toBe("https://cvunfold.com/raport");
  });

  it("stores only the closed attribution allowlist and sends GA4 campaign fields", () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_medium=cpc&utm_campaign=cv_developer_pl_search&utm_content=123-456&utm_term=cv+seniora&gclid=abc_DEF-123&email=private%40example.com");
    expect(readSafeAttribution()).toEqual({
      source: "google", medium: "cpc", campaign: "cv_developer_pl_search", content: "123-456", term: "cv seniora", gclid: "abc_DEF-123",
    });

    const gtag = vi.fn();
    window.gtag = gtag;
    writeConsent("granted");
    markAnalyticsReady();
    trackAnalyticsEvent("page_view", { locale: "pl", market: "pl", landing_variant: "developer" });
    expect(gtag).toHaveBeenCalledWith("event", "page_view", expect.objectContaining({
      campaign_source: "google",
      campaign_medium: "cpc",
      campaign_name: "cv_developer_pl_search",
      campaign_content: "123-456",
      campaign_term: "cv seniora",
      landing_variant: "developer",
    }));
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("private@example.com");
  });
});

describe("file picker diagnostics", () => {
  it("accepts only closed file-interaction fields", () => {
    expect(safeAnalyticsPayload("upload_started", {
      locale: "pl", market: "pl", plan: "full_review", broad_role_enum: "frontend_developer",
      selected_seniority_enum: "senior", upload_entrypoint: "picker", landing_variant: "developer",
      filename: "private-cv.pdf", file_provider: "google-drive", cv_text: "secret",
    }).properties).toEqual({
      locale: "pl", market: "pl", plan: "full_review", broad_role_enum: "frontend_developer",
      selected_seniority_enum: "senior", upload_entrypoint: "picker", landing_variant: "developer",
    });
    expect(safeAnalyticsPayload("file_picker_cancelled", {
      locale: "pl", market: "pl", plan: "full_review", filename: "private-cv.pdf",
    }).properties).toEqual({ locale: "pl", market: "pl", plan: "full_review" });
  });

  it("keeps plan and the closed variant on sample-report views", () => {
    expect(safeAnalyticsPayload("sample_report_viewed", {
      locale: "en", market: "en", plan: "full_review", landing_variant: "developer", report_token: "secret",
    }).properties).toEqual({ locale: "en", market: "en", plan: "full_review", landing_variant: "developer" });
  });
});

describe("checkout diagnostic events", () => {
  it("allows only privacy-safe cancellation fields", () => {
    expect(safeAnalyticsPayload("checkout_cancelled", {
      locale: "pl", market: "pl", plan: "full_review", filename: "private-cv.pdf",
    }).properties).toEqual({ locale: "pl", market: "pl", plan: "full_review" });
  });

  it("allows only closed purchase CTA surface and payment method values", () => {
    expect(safeAnalyticsPayload("unlock_cta_clicked", {
      locale: "pl", market: "pl", plan: "full_review", purchase_surface: "mobile_sticky", payment_method: "standard",
      filename: "private-cv.pdf", report_token: "secret", card_last4: "4242",
    }).properties).toEqual({
      locale: "pl", market: "pl", plan: "full_review", purchase_surface: "mobile_sticky", payment_method: "standard",
    });
    expect(safeAnalyticsPayload("unlock_cta_viewed", {
      locale: "pl", market: "pl", plan: "full_review", purchase_surface: "floating_unknown", payment_method: "wallet_unknown",
    }).properties).toEqual({ locale: "pl", market: "pl", plan: "full_review" });
  });
});

describe("analysis configuration alert event", () => {
  it("allows only coarse, non-sensitive fields", () => {
    expect(safeAnalyticsPayload("analysis_configuration_failed", {
      locale: "pl", market: "pl", plan: "full_review", analysis_success: false,
      filename: "private-cv.pdf", provider_message: "invalid_api_key", report_token: "secret",
    }).properties).toEqual({ locale: "pl", market: "pl", plan: "full_review", analysis_success: false });
  });
});
