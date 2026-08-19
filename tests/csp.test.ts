import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

describe("Content Security Policy", () => {
  it("allows the documented GA4 and Google Ads endpoints when measurement is enabled", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: true, stripeEnabled: false, turnstileEnabled: true, development: false });

    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://www.googletagmanager.com");
    expect(policy).toContain("https://www.googleadservices.com");
    expect(policy).toContain("https://pagead2.googlesyndication.com");
    expect(policy).toContain("img-src 'self' data: blob: https://www.googletagmanager.com");
    expect(policy).toContain("https://*.google-analytics.com");
    expect(policy).toContain("https://*.analytics.google.com");
    expect(policy).toContain("https://*.g.doubleclick.net");
    expect(policy).toContain("frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/(?:^|; )[a-z-]+-src \*(?:;|$)/);
  });

  it("does not expose Google endpoints when measurement is disabled", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: false, stripeEnabled: false, turnstileEnabled: false, development: false });

    expect(policy).not.toContain("googletagmanager.com");
    expect(policy).not.toContain("googleadservices.com");
    expect(policy).not.toContain("stripe.com");
    expect(policy).toContain("img-src 'self' data: blob:");
    expect(policy).toContain("frame-src 'self'");
  });

  it("allows only the documented Stripe.js and Checkout endpoints when wallet payments are enabled", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: false, stripeEnabled: true, turnstileEnabled: false, development: false });

    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://checkout.stripe.com https://js.stripe.com https://*.js.stripe.com");
    expect(policy).toContain("img-src 'self' data: blob: https://*.stripe.com");
    expect(policy).toContain("connect-src 'self' https://checkout.stripe.com https://api.stripe.com");
    expect(policy).toContain("frame-src 'self' https://checkout.stripe.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com");
    expect(policy).not.toMatch(/(?:^|; )[a-z-]+-src \*(?:;|$)/);
  });

  it("allows eval only in local development", () => {
    const development = buildContentSecurityPolicy({ googleEnabled: false, stripeEnabled: false, turnstileEnabled: false, development: true });
    const production = buildContentSecurityPolicy({ googleEnabled: false, stripeEnabled: false, turnstileEnabled: false, development: false });

    expect(development).toContain("'unsafe-eval'");
    expect(production).not.toContain("'unsafe-eval'");
  });
});

describe("wallet payment domains", () => {
  it("allows the Google Pay and Apple Pay origins the Express Checkout Element needs", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: false, stripeEnabled: true, turnstileEnabled: false, development: false });
    for (const directive of ["script-src", "frame-src", "connect-src"]) {
      const line = policy.split("; ").find((part) => part.startsWith(directive)) ?? "";
      expect(line).toContain("https://pay.google.com");
      expect(line).toContain("https://applepay.cdn-apple.com");
    }
  });

  it("keeps wallet origins out of the policy when payments are disabled", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: true, stripeEnabled: false, turnstileEnabled: true, development: false });
    expect(policy).not.toContain("pay.google.com");
    expect(policy).not.toContain("applepay.cdn-apple.com");
  });
});
