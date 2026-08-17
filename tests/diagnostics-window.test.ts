import { describe, expect, it } from "vitest";
import { clampWindowDays, summarizeTrafficMix } from "@/lib/data/store";
import { GET } from "@/app/api/admin/diagnostics/route";

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

describe("traffic mix", () => {
  const events = [
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "cpc" } },
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "cpc" } },
    { event_name: "analysis_started", safe_properties: { source: "google", medium: "organic" } },
    { event_name: "analysis_started", safe_properties: {} },
    { event_name: "purchase", safe_properties: { source: "google", medium: "cpc" } },
  ];

  it("counts the attribution the server recorded, not only consented sessions", () => {
    const mix = summarizeTrafficMix(events);
    expect(mix.byMedium).toEqual({ "(direct)": 1, cpc: 2, organic: 1 });
    expect(mix.bySource).toEqual({ "(direct)": 1, google: 3 });
  });

  it("ignores events other than the requested step", () => {
    expect(summarizeTrafficMix(events, "purchase").byMedium).toEqual({ cpc: 1 });
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
