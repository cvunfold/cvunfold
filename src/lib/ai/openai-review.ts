import { createHash } from "node:crypto";
import type { CareerContext } from "./career-context";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { modelResponseSchema, REPORT_SCHEMA_VERSION, type CVReport } from "./schemas/report";
import { applyServerRubric, auditCalibration, validateEvidence } from "./validate-report";
import type { Segment } from "@/lib/document-parsing";
import { getRubric, RUBRIC_VERSION, scoringSeniority, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { getReviewPrompt, resolveEvaluationStage } from "./prompts";
import { REVIEW_PIPELINE_VERSION, type ReviewProvenance } from "./review-provenance";
import { reviewPromptVersion } from "./review-prompt-version";
import { ASSESSMENT_VERSION, ASSESSMENT_VALIDATION_VERSION, assessmentSchema, validateAssessment, scoreAssessment, lockAssessment, usesEvidenceAssessment, type EvidenceAssessment } from "./evidence-assessment";
import { REPORT_POLICY_VERSION } from "./report-policy";
import { estimateCostUsd } from "./model-pricing";
import { resolveReviewModel } from "./model-config";
import { EVIDENCE_SCORE_BASE, EVIDENCE_SCORE_STEP, SCORE_THRESHOLDS } from "@/lib/rubrics/score-scale";

type ReviewInput = { segments: Segment[]; targetRole: TargetRoleId; targetSeniority: Seniority; careerContext?: CareerContext; jobDescription?: string; locale: "pl" | "en"; maxOutputTokens?: number; cachedAssessment?: EvidenceAssessment; onRejectedAssessment?: (raw: unknown) => void };
export type ReviewTelemetry = { model: string; inputTokens: number; outputTokens: number; estimatedCost: number | null; provenance: ReviewProvenance };

const retryableStatuses = new Set([408, 409, 429, 500, 502, 503, 504, 520]);
const DEFAULT_REVIEW_TIMEOUT_MS = 90_000;

// SDK retries retain the same model. A timeout must never switch the analysis
// to a different model; the request configuration is recorded in provenance.
export function resolveReviewTimeoutMs(): number {
  const requested = Number(process.env.OPENAI_REVIEW_TIMEOUT_MS);
  // Below 30s legitimate reports get cut off; above 280s the request would
  // outlive the serverless function and fail without a stored result anyway.
  return Number.isFinite(requested) && requested >= 30_000 && requested <= 280_000 ? requested : DEFAULT_REVIEW_TIMEOUT_MS;
}

export function fallbackModelDisabled(): boolean {
  return true;
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

export async function reviewWithOpenAI(input: ReviewInput): Promise<{ report: CVReport; telemetry: ReviewTelemetry; assessment?: EvidenceAssessment }> {
  const apiKey = process.env.OPENAI_API_KEY; const model = resolveReviewModel();
  if (!apiKey) throw new Error("OPENAI_NOT_CONFIGURED");
  const fallbackDisabled = fallbackModelDisabled();
  const timeoutMs = resolveReviewTimeoutMs();
  const maxRetries = process.env.OPENAI_REVIEW_MAX_RETRIES === "0" ? 0 : 2;
  const client = new OpenAI({ apiKey, organization: process.env.OPENAI_ORG_ID, project: process.env.OPENAI_PROJECT_ID, timeout: timeoutMs, maxRetries });
  const careerContext = input.targetSeniority === "first_job" ? "first_job" : input.careerContext || "standard";
  const roleProfile = getTargetRoleProfile(input.targetRole, input.locale);
  const rubric = getRubric(input.targetSeniority, input.targetRole, input.locale, careerContext);
  const { version: basePromptVersion, systemPrompt: baseSystemPrompt, assessmentPrompt, variant: promptVariant } = getReviewPrompt(input.locale, input.targetSeniority, careerContext, input.targetRole);
  const separated = usesEvidenceAssessment(input.targetRole, input.targetSeniority, careerContext);
  const requestOptions = separated ? { signal: AbortSignal.timeout(Math.min(timeoutMs * 2, 240_000)) } : undefined;
  const selectedModel = model;
  const withRequestDeadline = async <T>(request: (model: string) => Promise<T>): Promise<T> => {
    try { return await request(selectedModel); } catch (error) {
      if (requestOptions?.signal.aborted) throw new Error("ANALYSIS_TIMEOUT");
      throw error;
    }
  };
  // Equivalent UI selectors share the same assessment input. The raw selector
  // remains in the report, but cannot bias a resolved first-job evaluation.
  const assessmentData = { version: ASSESSMENT_VERSION, targetRole: input.targetRole, evaluationStage: resolveEvaluationStage(input.targetSeniority, careerContext), careerContext, evidence: input.segments, jobDescription: input.jobDescription || null };
  const assessmentFormat = zodTextFormat(assessmentSchema, "cv_evidence_assessment");
  const assessmentFingerprint = createHash("sha256").update(JSON.stringify({ model, prompt: assessmentPrompt, data: assessmentData, format: assessmentFormat.schema, maxOutputTokens: 8000, store: false })).digest("hex");
  let assessment: EvidenceAssessment | undefined;
  let assessmentInputTokens = 0;
  let assessmentOutputTokens = 0;
  let assessmentCost = 0;
  let assessmentCostKnown = true;
  if (separated && input.cachedAssessment) {
    assessment = validateAssessment(input.cachedAssessment, input.segments, input.targetSeniority, careerContext);
  } else if (separated) {
    const response = await withRequestDeadline(selected => client.responses.parse({
      model: selected, store: false,
      input: [
        { role: "system", content: assessmentPrompt },
        { role: "user", content: JSON.stringify(assessmentData) },
      ],
      text: { format: assessmentFormat },
      max_output_tokens: 8000,
    }, requestOptions));
    try { assessment = validateAssessment(response.output_parsed, input.segments, input.targetSeniority, careerContext); }
    catch (error) {
      // Only the local synthetic evaluator supplies this hook. Public routes
      // never record rejected source content or send it to logs/analytics.
      input.onRejectedAssessment?.(response.output_parsed);
      throw error;
    }
    assessmentInputTokens = response.usage?.input_tokens || 0;
    assessmentOutputTokens = response.usage?.output_tokens || 0;
    const cost = estimateCostUsd(selectedModel, assessmentInputTokens, assessmentOutputTokens).cost;
    assessmentCostKnown = cost !== null;
    assessmentCost = cost || 0;
  }
  const locked = assessment ? scoreAssessment(assessment, input.targetRole, input.targetSeniority, input.locale, careerContext) : undefined;
  const rubricVersion = RUBRIC_VERSION;
  const promptVersion = reviewPromptVersion(basePromptVersion, separated);
  const systemPrompt = baseSystemPrompt;
  const payload = {
    version: REPORT_SCHEMA_VERSION,
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
    careerContext: careerContext,
    requiredPromptVersion: promptVersion,
    rubricVersion,
    rubric,
    evidence: input.segments,
    jobDescription: input.jobDescription || null,
    ...(locked ? { lockedAssessment: locked, assessedChecks: assessment, scoringRules: `Each satisfied signal contributes ${EVIDENCE_SCORE_STEP} points above the missing-information baseline ${EVIDENCE_SCORE_BASE}. All five satisfied signals give 100/100 unless a material concern caps the category. Important/critical concerns cap category points at ${SCORE_THRESHOLDS.importantCap}/${SCORE_THRESHOLDS.criticalCap}, with their severity preserved. Strong/provisional document reception starts at ${SCORE_THRESHOLDS.strong}/${SCORE_THRESHOLDS.provisional}, subject to the locked scope and concern rules. 100/100 means all criteria for the selected role/stage are satisfied by visible document evidence, not perfect competence or guaranteed employment.` } : {}),
  };
  const request = (selectedModel: string) => client.responses.parse({
    model: selectedModel,
    store: false,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${input.locale === "en" ? "Analyse the following data and prepare a report that follows the system goal and schema" : "Przeanalizuj poniższe dane i przygotuj raport zgodny z systemowym celem oraz schematem"}:\n${JSON.stringify(payload)}` },
    ],
    text: { format: zodTextFormat(modelResponseSchema, "cv_report") },
    ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
  }, requestOptions);
  const response = await withRequestDeadline(request);
  if (!response.output_parsed) throw new Error("OPENAI_INVALID_RESPONSE");
  if (new Set(response.output_parsed.categoryScores.map(category => category.key)).size !== 6) throw new Error("OPENAI_INVALID_RESPONSE");
  const issueIds = new Set(response.output_parsed.issues.map(issue => issue.id));
  if (issueIds.size !== response.output_parsed.issues.length
    || response.output_parsed.nextSteps.some(step => step.issueId !== undefined && !issueIds.has(step.issueId))
    || response.output_parsed.recruiterPerspective.reservations.some(item => item.issueId !== undefined && !issueIds.has(item.issueId))) throw new Error("OPENAI_INVALID_RESPONSE");
  // The rubric sent with the request carried neutral weights when the visitor left
  // seniority on auto. Now that the model has read the CV, score with the profile
  // for the level it actually perceived.
  const scoringRubric = getRubric(
    scoringSeniority(input.targetSeniority, response.output_parsed.document.perceivedSeniority),
    input.targetRole,
    input.locale,
    careerContext,
  );
  const normalized = applyServerRubric({
    ...response.output_parsed,
    version: REPORT_SCHEMA_VERSION,
    rubricVersion,
    promptVersion,
    locale: input.locale,
    document: {
      ...response.output_parsed.document,
      targetRole: roleProfile.label,
      targetSeniority: input.targetSeniority,
    },
  }, scoringRubric);
  let report = validateEvidence(
    locked ? lockAssessment(normalized, locked) : normalized,
    new Set(input.segments.map((segment) => segment.id)),
    Object.fromEntries(input.segments.map((segment) => [segment.id, segment.text])),
    { diagnosticsLocked: Boolean(locked) },
  );
  if (locked) report = lockAssessment(report, locked);
  if (assessment) report.evidenceAssessment = { version: `${ASSESSMENT_VERSION}+${ASSESSMENT_VALIDATION_VERSION}`, checks: assessment };
  report.locale = input.locale;
  report.document.careerContext = careerContext;
  const inputTokens = (response.usage?.input_tokens || 0) + assessmentInputTokens;
  const outputTokens = (response.usage?.output_tokens || 0) + assessmentOutputTokens;
  // Both stages use the same model and its own pricing entry.
  const { cost: writingCost, pricing } = estimateCostUsd(selectedModel, response.usage?.input_tokens || 0, response.usage?.output_tokens || 0);
  const estimatedCost = writingCost !== null && assessmentCostKnown ? writingCost + assessmentCost : null;
  const provenance: ReviewProvenance = {
    promptVersion,
    ...(separated ? { assessmentFingerprint, assessmentVersion: ASSESSMENT_VERSION, assessmentValidationVersion: ASSESSMENT_VALIDATION_VERSION, assessmentOrigin: input.cachedAssessment ? "cached_model_response" as const : "live" as const } : {}),
    promptVariant,
    rubricVersion,
    pipelineVersion: REVIEW_PIPELINE_VERSION,
    reportPolicyVersion: REPORT_POLICY_VERSION,
    model: selectedModel,
    requestedModel: model,
    fallbackUsed: selectedModel !== model,
    modelConfig: {
      maxOutputTokens: input.maxOutputTokens ?? null,
      timeoutMs,
      fallbackDisabled,
      responseFormat: "cv_report",
      store: false,
      maxRetries,
    },
    // Records whether the cost figure came from the per-model table or a stale
    // environment rate, so an untrustworthy number is visible as such.
    pricing,
    calibrationViolations: auditCalibration(report),
  };
  return { report, ...(assessment ? { assessment } : {}), telemetry: { model: selectedModel, inputTokens, outputTokens, estimatedCost, provenance } };
}
