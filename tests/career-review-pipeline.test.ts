import { afterEach, expect, it, vi } from "vitest";
import { createCareerSample } from "@/lib/ai/career-samples";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
import { getReviewPrompt } from "@/lib/ai/prompts";
import { ASSESSMENT_VERSION, type EvidenceAssessment } from "@/lib/ai/evidence-assessment";
import { RUBRIC_CATEGORY_KEYS } from "@/lib/ai/schemas/report";
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({ default: class { responses = { parse }; } }));
const originalKey = process.env.OPENAI_API_KEY, originalModel = process.env.OPENAI_REVIEW_MODEL;
afterEach(() => {
  vi.unstubAllEnvs();
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENAI_REVIEW_MODEL; else process.env.OPENAI_REVIEW_MODEL = originalModel;
  parse.mockReset();
});
function example(locale: "pl" | "en") {
  const report = createCareerSample("bootcamp", locale);
  const segments = Object.entries(report.evidenceMap!).map(([id, text]) => ({ id, text }));
  const evidence = [{ ref: segments[0].id, quote: segments[0].text }];
  const assessment: EvidenceAssessment = { profile: { perceivedRole: "Frontend Developer", perceivedSeniority: "junior", scope: "educational_project", confidence: "high", evidence }, evaluatedStage: "first_job", categories: RUBRIC_CATEGORY_KEYS.map(key => ({ key, signals: Array.from({ length: 5 }, () => ({ satisfied: true, evidence })) })), concerns: [] };
  report.issues = []; report.nextSteps = []; report.recruiterPerspective.reservations = [];
  return { report, segments, assessment };
}
it("runs the same assessment then localized writing, retaining fixed grades and usage", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key"; process.env.OPENAI_REVIEW_MODEL = "gpt-6-luna";
  const fingerprints: string[] = [];
  const source = example("en");
  for (const locale of ["pl", "en"] as const) {
    const report = { ...source.report, locale, version: "model-guessed-version" };
    parse.mockResolvedValueOnce({ output_parsed: source.assessment, usage: { input_tokens: 100, output_tokens: 50 } });
    parse.mockResolvedValueOnce({ output_parsed: report, usage: { input_tokens: 200, output_tokens: 150 } });
    const result = await reviewWithOpenAI({ segments: source.segments, locale, targetRole: "frontend_developer", targetSeniority: "first_job" });
    expect(parse.mock.calls.at(-2)![0].input[0].content).toBe(getReviewPrompt(locale, "first_job", "first_job", "frontend_developer").assessmentPrompt);
    expect(parse.mock.calls.at(-1)![0].input[0].content).toBe(getReviewPrompt(locale, "first_job", "first_job", "frontend_developer").systemPrompt);
    expect(result.report.summary.overallScore).toBe(100);
    expect(result.report.version).toBe("2.1.0");
    expect(result.report.rubricVersion).toBe("technical-v2.2.0");
    expect(parse.mock.calls.at(-2)![0].model).toBe("gpt-6-luna");
    expect(parse.mock.calls.at(-1)![0].model).toBe("gpt-6-luna");
    expect(result.telemetry).toMatchObject({ model: "gpt-6-luna", inputTokens: 300, outputTokens: 200, provenance: { model: "gpt-6-luna", requestedModel: "gpt-6-luna", fallbackUsed: false, modelConfig: { fallbackDisabled: true }, assessmentVersion: ASSESSMENT_VERSION } });
    fingerprints.push(result.telemetry.provenance.assessmentFingerprint!);
  }
  expect(fingerprints[0]).toBe(fingerprints[1]);
});
it("rejects unsupported assessment quotations before generating prose", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key"; process.env.OPENAI_REVIEW_MODEL = "gpt-6-luna";
  const sample = example("en");
  sample.assessment.categories[0].signals[0].evidence = [{ ref: sample.segments[0].id, quote: "Invented 123 customers." }];
  parse.mockResolvedValueOnce({ output_parsed: sample.assessment });
  const onRejectedAssessment = vi.fn();
  await expect(reviewWithOpenAI({ segments: sample.segments, locale: "en", targetRole: "frontend_developer", targetSeniority: "first_job", onRejectedAssessment })).rejects.toThrow("ASSESSMENT_QUOTE_INVALID");
  expect(onRejectedAssessment).toHaveBeenCalledWith(sample.assessment);
  expect(parse).toHaveBeenCalledTimes(1);
});
it("revalidates same-version cached assessments without counting old provider usage", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key"; process.env.OPENAI_REVIEW_MODEL = "gpt-6-luna";
  const sample = example("pl");
  parse.mockResolvedValueOnce({ output_parsed: sample.report, usage: { input_tokens: 120, output_tokens: 80 } });
  const result = await reviewWithOpenAI({ segments: sample.segments, locale: "pl", targetRole: "frontend_developer", targetSeniority: "first_job", cachedAssessment: sample.assessment });
  expect(parse).toHaveBeenCalledTimes(1);
  expect(result.telemetry.inputTokens).toBe(120);
  expect(result.telemetry.provenance.assessmentOrigin).toBe("cached_model_response");
});
it("canonicalizes auto and junior selectors to the same explicit first-job assessment", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key"; process.env.OPENAI_REVIEW_MODEL = "gpt-6-luna";
  const sample = example("en");
  const fingerprints: string[] = [];
  const payloads: string[] = [];
  for (const stage of ["first_job", "junior", "auto"] as const) {
    parse.mockResolvedValueOnce({ output_parsed: sample.assessment });
    parse.mockResolvedValueOnce({ output_parsed: sample.report });
    const result = await reviewWithOpenAI({ segments: sample.segments, locale: "en", targetRole: "frontend_developer", targetSeniority: stage, careerContext: "first_job" });
    payloads.push(parse.mock.calls.at(-2)![0].input[1].content);
    fingerprints.push(result.telemetry.provenance.assessmentFingerprint!);
    expect(result.report.document.targetSeniority).toBe(stage);
    expect(result.report.summary.overallScore).toBe(100);
  }
  expect(new Set(payloads).size).toBe(1);
  expect(new Set(fingerprints).size).toBe(1);
});

it("rejects a stale model before making a provider request", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key";
  process.env.OPENAI_REVIEW_MODEL = "gpt-5.6-luna";
  await expect(reviewWithOpenAI({ segments: [], locale: "pl", targetRole: "frontend_developer", targetSeniority: "first_job" })).rejects.toThrow("OPENAI_NOT_CONFIGURED");
  expect(parse).not.toHaveBeenCalled();
});

it.each(["assessment", "writing"])("does not switch models after a transient %s failure", async (stage) => {
  process.env.OPENAI_API_KEY = "synthetic-test-key";
  delete process.env.OPENAI_REVIEW_MODEL;
  vi.stubEnv("OPENAI_REVIEW_FALLBACK_MODEL", "gpt-5.6-luna");
  vi.stubEnv("OPENAI_REVIEW_DISABLE_FALLBACK", "false");
  const sample = example("pl");
  const error = { status: 520, name: "InternalServerError" };
  if (stage === "writing") parse.mockResolvedValueOnce({ output_parsed: sample.assessment });
  parse.mockRejectedValueOnce(error);
  await expect(reviewWithOpenAI({ segments: sample.segments, locale: "pl", targetRole: "frontend_developer", targetSeniority: "first_job" })).rejects.toBe(error);
  expect(parse).toHaveBeenCalledTimes(stage === "writing" ? 2 : 1);
  expect(parse.mock.calls.every(([request]) => request.model === "gpt-6-luna")).toBe(true);
});
