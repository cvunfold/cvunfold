import { describe, expect, it } from "vitest";
import { googleConsentDefaults } from "@/components/google-analytics";

describe("Google tag bootstrap", () => {
  it("initializes gtag.js after applying denied consent defaults", () => {
    const consentDefault = googleConsentDefaults.indexOf("gtag('consent', 'default'");
    const tagInitialization = googleConsentDefaults.indexOf("gtag('js', new Date())");

    expect(consentDefault).toBeGreaterThan(-1);
    expect(tagInitialization).toBeGreaterThan(consentDefault);
  });
});
