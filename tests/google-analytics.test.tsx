// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics, googleConsentDefaults } from "@/components/google-analytics";
import { readSafeAttribution } from "@/lib/analytics/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("Google tag bootstrap", () => {
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
