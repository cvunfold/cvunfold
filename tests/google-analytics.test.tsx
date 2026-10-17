// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics, googleConsentDefaults } from "@/components/google-analytics";
import { readSafeAttribution, writeConsent, clearPendingAnalytics, resetAnalyticsReady } from "@/lib/analytics/client";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  navigation.pathname = "/";
  clearPendingAnalytics(); resetAnalyticsReady(); delete window.gtag;
  document.querySelector('script[data-product-google-tag="true"]')?.remove();
});

describe("Google tag bootstrap", () => {
  it("measures a public school offer and its CTA after consent", () => {
    navigation.pathname = "/dla-szkol";
    window.history.replaceState({}, "", "/dla-szkol?utm_source=linkedin");
    writeConsent("granted");
    window.gtag = vi.fn();
    render(<><GoogleAnalytics analyticsId="G-TEST"/><button data-analytics-event="school_contact_clicked" data-analytics-placement="pilot">Pilot</button></>);
    fireEvent.click(screen.getByText("Pilot"));
    expect(window.gtag).toHaveBeenCalledWith("event", "school_offer_viewed", expect.objectContaining({ locale: "pl", source: "linkedin" }));
    expect(window.gtag).toHaveBeenCalledWith("event", "school_contact_clicked", expect.objectContaining({ school_placement: "pilot" }));
  });

  it("offers a consent choice on the English school offer and does not track before consent", () => {
    navigation.pathname = "/en/for-schools";
    window.gtag = vi.fn();
    render(<GoogleAnalytics analyticsId="G-TEST"/>);
    expect(screen.getByRole("button", { name: "Necessary only" })).toBeTruthy();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it.each(["/dla-szkol/panel", "/dla-szkol/demo", "/dla-szkol/potwierdz", "/en/for-schools/panel"])("does not load or configure Google on %s", pathname => {
    navigation.pathname = pathname;
    writeConsent("granted"); window.gtag = vi.fn();
    render(<GoogleAnalytics analyticsId="G-TEST"/>);
    expect(window.gtag).not.toHaveBeenCalled();
    expect(document.querySelector('script[data-product-google-tag="true"]')).toBeNull();
  });
  it("initializes gtag.js after applying denied consent defaults", () => {
    const consentDefault = googleConsentDefaults.indexOf("gtag('consent', 'default'");
    const tagInitialization = googleConsentDefaults.indexOf("gtag('js', new Date())");

    expect(consentDefault).toBeGreaterThan(-1);
    expect(tagInitialization).toBeGreaterThan(consentDefault);
  });
});

describe("attribution capture before consent", () => {
  // The click-through CTA (analysisPath) never forwards the landing page's query string, so a
  // gclid/UTM present on first paint only survives to /analiza if it lands in sessionStorage
  // before the visitor navigates away. That write must not wait for a consent decision.
  it("survives navigation to a page with no query string, without any consent decision", () => {
    window.history.pushState({}, "", "/?utm_source=google&utm_medium=cpc&gclid=abc123");

    render(<GoogleAnalytics analyticsId="G-TEST" />);

    // Simulates the click-through to /analiza, whose CTA never forwards the query string.
    // If nothing captured the attribution above before this point, it is gone for good.
    window.history.pushState({}, "", "/analiza");

    expect(readSafeAttribution()).toEqual(expect.objectContaining({ source: "google", medium: "cpc", gclid: "abc123" }));
  });
});
