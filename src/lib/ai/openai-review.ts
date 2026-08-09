import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { reportSchema, type CVReport } from "./schemas/report";
import { applyServerRubric, validateEvidence } from "./validate-report";
import type { Segment } from "@/lib/document-parsing";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./prompts/review-pl-v3";
import { EN_PROMPT_VERSION, EN_SYSTEM_PROMPT } from "./prompts/review-en-v1";

type ReviewInput = { segments: Segment[]; targetRole: TargetRoleId; targetSeniority: Seniority; jobDescription?: string; locale: "pl" | "en"; maxOutputTokens?: number };
export type ReviewTelemetry = { model: string; inputTokens: number; outputTokens: number; estimatedCost: number | null };

export async function reviewWithOpenAI(input: ReviewInput): Promise<{ report: CVReport; telemetry: ReviewTelemetry }> {
  const apiKey = process.env.OPENAI_API_KEY; const model = process.env.OPENAI_REVIEW_MODEL;
  if (!apiKey || !model) throw new Error("OPENAI_NOT_CONFIGURED");
  const client = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 2 });
  const roleProfile = getTargetRoleProfile(input.targetRole, input.locale);
  const rubric = getRubric(input.targetSeniority, input.targetRole, input.locale);
  const promptVersion = input.locale === "en" ? EN_PROMPT_VERSION : PROMPT_VERSION;
  const systemPrompt = input.locale === "en" ? EN_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const payload = {
    locale: input.locale,
    targetRole: roleProfile.label,
    roleProfile: {
      specialization: roleProfile.description,
      evaluationFocus: roleProfile.evaluationFocus,
      credibilityCategory: roleProfile.credibilityLabel,
      systemsCategory: roleProfile.systemsLabel,
    },
    targetSeniority: input.targetSeniority,
    requiredPromptVersion: promptVersion,
    rubric,
    evidence: input.segments,
    jobDescription: input.jobDescription || null,
  };
  const response = await client.responses.parse({
    model,
    store: false,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${input.locale === "en" ? "Analyse the following data and prepare a report that follows the system goal and schema" : "Przeanalizuj poniższe dane i przygotuj raport zgodny z systemowym celem oraz schematem"}:\n${JSON.stringify(payload)}` },
    ],
    text: { format: zodTextFormat(reportSchema, "cv_report") },
    ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
  });
  if (!response.output_parsed) throw new Error("OPENAI_INVALID_RESPONSE");
  const normalized = applyServerRubric({
    ...response.output_parsed,
    rubricVersion: RUBRIC_VERSION,
    promptVersion,
    document: {
      ...response.output_parsed.document,
      targetRole: roleProfile.label,
      targetSeniority: input.targetSeniority,
    },
  }, rubric);
  const report = validateEvidence(
    normalized,
    new Set(input.segments.map((segment) => segment.id)),
    Object.fromEntries(input.segments.map((segment) => [segment.id, segment.text])),
  );
  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  const inputRateRaw = process.env.OPENAI_INPUT_COST_PER_MILLION;
  const outputRateRaw = process.env.OPENAI_OUTPUT_COST_PER_MILLION;
  const inputRate = Number(inputRateRaw);
  const outputRate = Number(outputRateRaw);
  const estimatedCost = inputRateRaw && outputRateRaw && Number.isFinite(inputRate) && Number.isFinite(outputRate)
    ? (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000
    : null;
  return { report, telemetry: { model, inputTokens, outputTokens, estimatedCost } };
}
