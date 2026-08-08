import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { reportSchema } from "@/lib/ai/schemas/report";

describe("OpenAI report schema", () => {
  it("can be converted to a strict Structured Outputs format", () => {
    expect(() => zodTextFormat(reportSchema, "cv_report")).not.toThrow();
  });
});
