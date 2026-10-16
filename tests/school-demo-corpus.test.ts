import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/schools/cvs.json";
import reports from "../fixtures/schools/reports.json";
import { reportSchema } from "@/lib/ai/schemas/report";
import { calculateOverall } from "@/lib/ai/validate-report";
import { createSegments } from "@/lib/document-parsing";

describe("reviewed synthetic school corpus", () => {
  it("contains distinct source PDFs and actual model outputs with comparable criteria", () => {
    expect(reports).toHaveLength(10);
    expect(new Set(fixtures.map(item => item.text)).size).toBe(10);
    const signatures = new Set<string>();
    for (const item of reports) {
      expect(existsSync(`public${item.sourceUrl}`)).toBe(true);
      expect(existsSync(`public${item.sourceUrl.replace(/\.pdf$/, ".png")}`)).toBe(true);
      expect(reportSchema.safeParse(item.report).success).toBe(true);
      expect(item.report.summary.overallScore).toBe(calculateOverall(reportSchema.parse(item.report).categoryScores));
      expect(item.telemetry.model).not.toBe("mock");
      expect(item.telemetry.inputTokens).toBeGreaterThan(0);
      expect(item.telemetry.provenance.calibrationViolations).toEqual([]);
      signatures.add(`${item.report.rubricVersion}:${item.report.document.targetRole}:${item.report.document.targetSeniority}`);
    }
    expect(signatures.size).toBe(1);
    expect(new Set(reports.map(item => item.report.summary.overallScore)).size).toBeGreaterThanOrEqual(4);
  });
  it("grounds every retained quote in the source and never supplies invented gap rewrites", () => {
    for (const item of reports) {
      const source = createSegments(item.text).map(segment => segment.text);
      for (const quote of Object.values(item.report.evidenceMap!)) expect(source).toContain(quote);
      for (const issue of item.report.issues) {
        if (["gap", "question"].includes(issue.suggestion?.type || "")) expect(issue.suggestion?.proposed).toBeNull();
        for (const ref of issue.evidenceRefs) expect(item.report.evidenceMap).toHaveProperty(ref);
      }
    }
  });
});
