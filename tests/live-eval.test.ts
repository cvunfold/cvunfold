import { describe, expect, it } from "vitest";
import cases from "../fixtures/live-eval-cases.json";
import { createSegments } from "@/lib/document-parsing";
import { createMockReport } from "@/lib/ai/mock-report";
import { estimateWorstCaseCostPln, evaluateLiveReport, type LiveEvalCase } from "@/lib/ai/live-eval";

describe("live-model evaluation harness", () => {
  it("defines all launch cases in both languages", () => {
    const typed = cases as LiveEvalCase[];
    expect(typed).toHaveLength(13);
    expect(typed.every((item) => item.cv.pl.length > 0 && item.cv.en.length > 0)).toBe(true);
    expect(typed.filter((item) => item.injection)).toHaveLength(2);
    expect(typed.filter((item) => item.protectedTraits)).toHaveLength(1);
    expect(typed.filter((item) => item.rejectBeforeModel)).toHaveLength(1);
  });

  it("passes deterministic automatic checks for a valid report", () => {
    const report = createMockReport("senior", false, "frontend_developer", "pl");
    const segments = Object.entries(report.evidenceMap || {}).map(([id, text]) => ({ id, text }));
    expect(evaluateLiveReport(report, segments, "pl").every((check) => check.pass)).toBe(true);
  });

  it("fails when evidence points outside the parsed document", () => {
    const report = createMockReport("senior", false, "frontend_developer", "en");
    const checks = evaluateLiveReport(report, createSegments("Synthetic unrelated CV evidence long enough for segmentation."), "en");
    expect(checks.find((check) => check.name === "every evidenceRef exists")?.pass).toBe(false);
  });

  it("uses a conservative worst-case cost estimate", () => {
    const cost = estimateWorstCaseCostPln({
      cases: [{ cv: "x".repeat(3_500) }, { cv: "y".repeat(7_000), jobDescription: "z".repeat(1_000) }],
      systemPromptCharacters: 7_000,
      inputUsdPerMillion: 2,
      outputUsdPerMillion: 8,
      maxOutputTokens: 6_000,
      plnPerUsd: 5,
    });
    expect(cost).toBeGreaterThan(0.45);
    expect(cost).toBeLessThan(1);
  });
});
