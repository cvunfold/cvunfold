import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { reportSchema } from "@/lib/ai/schemas/report";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "@/lib/ai/prompts/review-pl-v3";
import { createMockReport } from "@/lib/ai/mock-report";

describe("OpenAI report schema", () => {
  it("can be converted to a strict Structured Outputs format", () => {
    expect(() => zodTextFormat(reportSchema, "cv_report")).not.toThrow();
  });

  it("requires the recruiter-perspective output in v3 reports", () => {
    const report = createMockReport("senior");
    expect(report.promptVersion).toBe(PROMPT_VERSION);
    expect(reportSchema.parse(report).recruiterPerspective.positiveSignals.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the review focused on document perception and evidence", () => {
    expect(SYSTEM_PROMPT).toContain("jaki obraz jego profilu powstaje wyłącznie z dokumentu");
    expect(SYSTEM_PROMPT).toContain("ATS jest wyłącznie higieną dokumentu");
    expect(SYSTEM_PROMPT).toContain("istniejące evidenceRefs");
    expect(SYSTEM_PROMPT).toContain("Nie oceniasz rzeczywistych kompetencji");
  });

  it("uses the selected discipline instead of frontend defaults", () => {
    expect(SYSTEM_PROMPT).toContain("roleProfile");
    expect(SYSTEM_PROMPT).toContain("nie oceniaj tej osoby jak developera funkcji");
    expect(SYSTEM_PROMPT).toContain("nie oceniaj tej osoby jak developera aplikacji");
  });
});
