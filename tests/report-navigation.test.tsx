// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportSessionPage } from "@/components/report-session-page";
import { toTeaser } from "@/lib/ai/validate-report";
import { createMockReport } from "@/lib/ai/mock-report";

vi.mock("@/components/report-view", () => ({ ReportView: () => <div>Loaded report</div> }));
vi.mock("@/lib/analytics/client", () => ({ trackAnalyticsEvent: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

describe("private report section navigation", () => {
  it.each(["section:strengths", "section:finding-cart-checks"])("reloads %s using the existing cookie, not a token exchange", async fragment => {
    window.history.replaceState(null, "", `/raport#${fragment}`);
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ paid: false, locale: "pl", report: toTeaser(createMockReport()) }) });
    vi.stubGlobal("fetch", fetch);
    render(<ReportSessionPage locale="pl" mockMode={false}/>);
    await screen.findByText("Loaded report");
    expect(fetch.mock.calls.map(call => call[0])).toEqual(["/api/report"]);
  });
  it("still exchanges a private report token before loading", async () => {
    const token = "a".repeat(43);
    window.history.replaceState(null, "", `/raport#${token}`);
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ path: "/raport", locale: "pl" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ paid: false, locale: "pl", report: toTeaser(createMockReport()) }) });
    vi.stubGlobal("fetch", fetch);
    render(<ReportSessionPage locale="pl" mockMode={false}/>);
    await screen.findByText("Loaded report");
    expect(fetch.mock.calls.map(call => call[0])).toEqual(["/api/report-session", "/api/report"]);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ token });
    expect(window.location.hash).toBe("");
  });
});
