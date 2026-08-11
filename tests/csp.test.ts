import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

describe("Content Security Policy", () => {
  it("allows the documented GA4 and Google Ads endpoints when measurement is enabled", () => {
    const policy = buildContentSecurityPolicy({ googleEnabled: true, turnstileEnabled: true, development: false });

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
    const policy = buildContentSecurityPolicy({ googleEnabled: false, turnstileEnabled: false, development: false });

    expect(policy).not.toContain("googletagmanager.com");
    expect(policy).not.toContain("googleadservices.com");
    expect(policy).toContain("img-src 'self' data: blob:");
    expect(policy).toContain("frame-src 'self'");
  });

  it("allows eval only in local development", () => {
    const development = buildContentSecurityPolicy({ googleEnabled: false, turnstileEnabled: false, development: true });
    const production = buildContentSecurityPolicy({ googleEnabled: false, turnstileEnabled: false, development: false });

    expect(development).toContain("'unsafe-eval'");
    expect(production).not.toContain("'unsafe-eval'");
  });
});
