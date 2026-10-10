import { afterEach, expect, it, vi } from "vitest";
import { createCareerSample } from "@/lib/ai/career-samples";
import { reviewWithOpenAI } from "@/lib/ai/openai-review";
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({ default: class { responses = { parse }; } }));
const originalKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_REVIEW_MODEL;
afterEach(() => {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENAI_REVIEW_MODEL; else process.env.OPENAI_REVIEW_MODEL = originalModel;
  parse.mockReset();
});

it("sends bootcamp context to the model, reweights auto from evidence and persists context for both locales", async () => {
  process.env.OPENAI_API_KEY = "synthetic-test-key";
  process.env.OPENAI_REVIEW_MODEL = "synthetic-test-model";
  for (const locale of ["pl", "en"] as const) {
    const output = createCareerSample("bootcamp", locale);
    // The model must not be trusted to set category weights or the selected target.
    output.categoryScores.forEach(category => { category.weight = 1; });
    output.document.targetSeniority = "senior";
    parse.mockResolvedValueOnce({ output_parsed: output, usage: { input_tokens: 100, output_tokens: 100 } });
    const segments = Object.entries(output.evidenceMap!).map(([id, text]) => ({ id, text }));
    const { report, telemetry } = await reviewWithOpenAI({ segments, locale, targetRole: "frontend_developer", targetSeniority: "first_job" });
    const request = parse.mock.calls.at(-1)![0];
    const payload = JSON.parse(request.input[1].content.split("\n").slice(1).join("\n"));
    expect(payload).toMatchObject({ careerContext: "first_job", targetSeniority: "first_job" });
    expect(request.input[0].content).toContain("career-v2.2.0");
    expect(request.input[0].content).toContain(locale === "pl" ? "WYBRANY ETAP: first_job" : "SELECTED STAGE: first_job");
    expect(request.input[0].content.match(/(?:WYBRANY ETAP|SELECTED STAGE):/g)).toHaveLength(1);
    expect(parse).toHaveBeenCalledTimes(locale === "pl" ? 1 : 2);
    expect(report.document).toMatchObject({ targetSeniority: "first_job", perceivedSeniority: "junior", careerContext: "first_job" });
    expect(report.categoryScores.find(category => category.key === "ownership")).toMatchObject({ weight: 0.15, label: locale === "pl" ? "Twój wkład w projekty" : "Your project contribution" });
    expect(telemetry.provenance.promptVersion).toContain("career-v2.2.0");
  }
});
