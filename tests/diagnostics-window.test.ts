import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { clampWindowDays, isRealPurchase, summarizeTrafficMix } from "@/lib/data/store";
import { clickAttributionPresent } from "@/lib/audience";
import { roleSources } from "@/lib/analytics/events";
import { GET } from "@/app/api/admin/diagnostics/route";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";

describe("diagnostics window", () => {
  it("keeps a caller-supplied window inside one day and the retention period", () => {
    expect(clampWindowDays(7)).toBe(7);
    expect(clampWindowDays("30")).toBe(30);
    expect(clampWindowDays(0)).toBe(1);
    expect(clampWindowDays(-5)).toBe(1);
    expect(clampWindowDays(9000)).toBe(90);
    expect(clampWindowDays(2.9)).toBe(2);
    expect(clampWindowDays("wczoraj")).toBe(1);
  });
});

describe("real purchases", () => {
  // Sandbox testing writes real "paid" rows in Stripe test mode, which once made a 87 zl
  // week of revenue read as 145 zl. Only a paid, live-mode row is real revenue.
  it("excludes a paid row from Stripe test mode", () => {
    expect(isRealPurchase({ status: "paid", livemode: false })).toBe(false);
  });

  it("excludes a pending row even in live mode", () => {
    expect(isRealPurchase({ status: "pending", livemode: true })).toBe(false);
  });

  it("counts only a paid, live-mode row", () => {
    expect(isRealPurchase({ status: "paid", livemode: true })).toBe(true);
  });
});

describe("traffic mix", () => {
  const events = [
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "cpc" } },
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "cpc" } },
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "organic" } },
    { event_name: "analysis_started", safe_properties: {} },
    // An Ads click that landed without utm_medium=cpc: no source/medium, but paid_click is set.
    { event_name: "analysis_started", safe_properties: { paid_click: true } },
    { event_name: "purchase", safe_properties: { source: "google", medium: "cpc" } },
  ];

  it("counts the attribution the server recorded, not only consented sessions", () => {
    const mix = summarizeTrafficMix(events);
    expect(mix.byMedium).toEqual({ "(direct)": 2, cpc: 2, organic: 1 });
    expect(mix.bySource).toEqual({ "(direct)": 2, google: 3 });
  });

  it("counts ad clicks separately, even without a recognised source/medium", () => {
    expect(summarizeTrafficMix(events).paidClicks).toBe(1);
  });

  it("ignores events other than the requested step", () => {
    const purchaseMix = summarizeTrafficMix(events, "purchase");
    expect(purchaseMix.byMedium).toEqual({ cpc: 1 });
    expect(purchaseMix.paidClicks).toBe(0);
  });
});

describe("clickAttributionPresent", () => {
  it("is true when an ad click ID reached the server", () => {
    expect(clickAttributionPresent({ gclid: "abc123" })).toBe(true);
    expect(clickAttributionPresent({ gbraid: "abc123" })).toBe(true);
    expect(clickAttributionPresent({ wbraid: "abc123" })).toBe(true);
  });

  it("is false without a click ID, even with UTM-based paid attribution", () => {
    expect(clickAttributionPresent({})).toBe(false);
    expect(clickAttributionPresent({ source: "google", medium: "cpc" })).toBe(false);
  });
});

describe("diagnostics endpoint", () => {
  const request = (url: string, secret?: string) =>
    new Request(url, secret ? { headers: { authorization: `Bearer ${secret}` } } : undefined);

  it("rejects a request without the admin secret", async () => {
    process.env.ADMIN_SECRET = "test-secret";
    const response = await GET(request("https://example.test/api/admin/diagnostics"));
    expect(response.status).toBe(401);
  });

  it("rejects a days value that is not a whole number", async () => {
    process.env.ADMIN_SECRET = "test-secret";
    const response = await GET(request("https://example.test/api/admin/diagnostics?days=-7", "test-secret"));
    expect(response.status).toBe(400);
  });

  it("reports the window it actually applied", async () => {
    process.env.ADMIN_SECRET = "test-secret";
    const response = await GET(request("https://example.test/api/admin/diagnostics?days=7", "test-secret"));
    expect(response.status).toBe(200);
    expect((await response.json()).windowDays).toBe(7);
  });
});

describe("role provenance reaches the database", () => {
  const store = readFileSync("src/lib/data/store.ts", "utf8");

  it("allows the new keys through the funnel-event sanitizer", () => {
    // recordFunnelEvent drops any key missing from safePropertyKeys, silently.
    // A dimension added only to the client vocabulary never reaches Supabase.
    const keys = store.slice(store.indexOf("const safePropertyKeys"), store.indexOf("const safePropertyEnums"));
    expect(keys).toContain('"role_source"');
    expect(keys).toContain('"detected_role_enum"');
  });

  it("keeps the stored role_source values in lockstep with the analytics vocabulary", () => {
    const stored = store.match(/role_source: \[([^\]]*)\]/)?.[1] || "";
    expect(stored).not.toBe("");
    for (const source of roleSources) expect(stored).toContain(`"${source}"`);
    expect(stored.split(",").length).toBe(roleSources.length);
  });
});


describe("authenticated runtime configuration", () => {
  it("verifies the live model and scoring policy without exposing credentials", async () => {
    vi.stubEnv("ADMIN_SECRET", "synthetic-admin-only");
    vi.stubEnv("OPENAI_REVIEW_MODEL", "gpt-6-luna");
    vi.stubEnv("OPENAI_API_KEY", "synthetic-private-key");
    try {
      const denied = await GET(new Request("https://cvunfold.test/api/admin/diagnostics?configuration=1"));
      expect(denied.status).toBe(401);
      const response = await GET(new Request("https://cvunfold.test/api/admin/diagnostics?configuration=1", { headers: { authorization: "Bearer synthetic-admin-only" } }));
      const value = await response.json();
      expect(value).toMatchObject({ reviewModel: "gpt-6-luna", noEvidenceScore: 20, pipelineVersion: REVIEW_PIPELINE_VERSION });
      expect(JSON.stringify(value)).not.toContain("synthetic-private-key");
      expect(JSON.stringify(value)).not.toContain("synthetic-admin-only");
    } finally { vi.unstubAllEnvs(); }
  });

  it("reports the effective default model when the environment has no override", async () => {
    vi.stubEnv("ADMIN_SECRET", "synthetic-admin-only");
    vi.stubEnv("OPENAI_REVIEW_MODEL", undefined);
    try {
      const response = await GET(new Request("http://localhost/api/admin/diagnostics?configuration=1", { headers: { authorization: "Bearer synthetic-admin-only" } }));
      expect((await response.json()).reviewModel).toBe("gpt-6-luna");
    } finally { vi.unstubAllEnvs(); }
  });
});
