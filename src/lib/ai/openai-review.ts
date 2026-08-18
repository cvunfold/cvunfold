import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { reportSchema, type CVReport } from "./schemas/report";
import { applyServerRubric, validateEvidence } from "./validate-report";
import type { Segment } from "@/lib/document-parsing";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { getReviewPrompt } from "./prompts";
import { REVIEW_PIPELINE_VERSION, type ReviewProvenance } from "./review-provenance";
import { estimateCostUsd } from "./model-pricing";

type ReviewInput = { segments: Segment[]; targetRole: TargetRoleId; targetSeniority: Seniority; jobDescription?: string; locale: "pl" | "en"; maxOutputTokens?: number };
export type ReviewTelemetry = { model: string; inputTokens: number; outputTokens: number; estimatedCost: number | null; provenance: ReviewProvenance };

const retryableStatuses = new Set([408, 409, 429, 500, 502, 503, 504, 520]);
const DEFAULT_REVIEW_TIMEOUT_MS = 90_000;

// A slow model can finish just under the timeout. Once it tips over, the timeout
// counts as retryable and the fallback model silently takes over — which makes a
// prompt or model comparison unattributable. Both knobs are recorded in
// provenance so a run always explains its own outcome.
export function resolveReviewTimeoutMs(): number {
  const requested = Number(process.env.OPENAI_REVIEW_TIMEOUT_MS);
  // Below 30s legitimate reports get cut off; above 280s the request would
  // outlive the serverless function and fail without a stored result anyway.
  return Number.isFinite(requested) && requested >= 30_000 && requested <= 280_000 ? requested : DEFAULT_REVIEW_TIMEOUT_MS;
}

export function fallbackModelDisabled(): boolean {
  return process.env.OPENAI_REVIEW_DISABLE_FALLBACK === "true";
}

export function isRetryableOpenAIError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: unknown; name?: unknown };
  const status = typeof value.status === "number" ? value.status : Number(value.status);
  if (Number.isFinite(status) && (retryableStatuses.has(status) || status >= 500)) return true;
  return typeof value.name === "string" && /(?:APIConnectionError|APITimeoutError|InternalServerError|RateLimitError)/.test(value.name);
}

export function toSafeOpenAIErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const value = error as { status?: unknown; code?: unknown; type?: unknown; name?: unknown };
  const status = typeof value.status === "number" ? value.status : Number(value.status);
  const code = typeof value.code === "string" ? value.code : "";
  const type = typeof value.type === "string" ? value.type : "";
  const name = typeof value.name === "string" ? value.name : "";

  if (
    status === 401
    || status === 403
    || /(?:invalid_api_key|authentication|insufficient_permissions)/i.test(`${code} ${type} ${name}`)
  ) return "OPENAI_AUTH_FAILED";
  if (status === 429 || /(?:rate_limit|insufficient_quota)/i.test(`${code} ${type} ${name}`)) return "OPENAI_RATE_LIMITED";
  return null;
}

export function getSafeOpenAIErrorDiagnostic(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== "object") return { kind: typeof error };
  const value = error as { status?: unknown; code?: unknown; type?: unknown; name?: unknown };
  const diagnostic: Record<string, string | number> = {};
  const status = typeof value.status === "number" ? value.status : Number(value.status);
  if (Number.isInteger(status) && status >= 400 && status <= 599) diagnostic.status = status;
  for (const [key, raw] of [["code", value.code], ["type", value.type], ["name", value.name]] as const) {
    if (typeof raw === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(raw)) diagnostic[key] = raw;
  }
  return Object.keys(diagnostic).length ? diagnostic : { kind: "unknown_object" };
}

export async function reviewWithOpenAI(input: ReviewInput): Promise<{ report: CVReport; telemetry: ReviewTelemetry }> {
  const apiKey = process.env.OPENAI_API_KEY; const model = process.env.OPENAI_REVIEW_MODEL;
  if (!apiKey || !model) throw new Error("OPENAI_NOT_CONFIGURED");
  const fallbackDisabled = fallbackModelDisabled();
  const fallbackModel = fallbackDisabled ? undefined : process.env.OPENAI_REVIEW_FALLBACK_MODEL?.trim();
  const timeoutMs = resolveReviewTimeoutMs();
  const client = new OpenAI({ apiKey, timeout: timeoutMs, maxRetries: 2 });
  const roleProfile = getTargetRoleProfile(input.targetRole, input.locale);
  const rubric = getRubric(input.targetSeniority, input.targetRole, input.locale);
  const { version: promptVersion, systemPrompt, variant: promptVariant } = getReviewPrompt(input.locale);
  const payload = {
    locale: input.locale,
    targetRole: roleProfile.label,
    roleProfile: {
      analysisMode: roleProfile.experimental ? "experimental_general" : "role_specific",
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
  const request = (selectedModel: string) => client.responses.parse({
    model: selectedModel,
    store: false,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${input.locale === "en" ? "Analyse the following data and prepare a report that follows the system goal and schema" : "Przeanalizuj poniższe dane i przygotuj raport zgodny z systemowym celem oraz schematem"}:\n${JSON.stringify(payload)}` },
    ],
    text: { format: zodTextFormat(reportSchema, "cv_report") },
    ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
  });
  let selectedModel = model;
  let response;
  try {
    response = await request(model);
  } catch (error) {
    if (!fallbackModel || fallbackModel === model || !isRetryableOpenAIError(error)) throw error;
    selectedModel = fallbackModel;
    response = await request(fallbackModel);
  }
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
  // Price the model that actually answered, which is not always the requested one.
  const { cost: estimatedCost, pricing } = estimateCostUsd(selectedModel, inputTokens, outputTokens);
  const provenance: ReviewProvenance = {
    promptVersion,
    promptVariant,
    rubricVersion: RUBRIC_VERSION,
    pipelineVersion: REVIEW_PIPELINE_VERSION,
    model: selectedModel,
    requestedModel: model,
    fallbackUsed: selectedModel !== model,
    modelConfig: {
      maxOutputTokens: input.maxOutputTokens ?? null,
      timeoutMs,
      fallbackDisabled,
      responseFormat: "cv_report",
      store: false,
    },
    // Records whether the cost figure came from the per-model table or a stale
    // environment rate, so an untrustworthy number is visible as such.
    pricing,
  };
  return { report, telemetry: { model: selectedModel, inputTokens, outputTokens, estimatedCost, provenance } };
}
