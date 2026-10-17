import type { ReviewPromptVariant } from "./prompts";
import type { ResolvedPricing } from "./model-pricing";
import type { CalibrationViolation } from "./validate-report";

// Bump this when the server-side report pipeline changes in a way that can alter
// a stored report for identical model output — segmentation, evidence
// validation, suggestion downgrades or action normalisation. Without it, two
// runs of the same prompt and model are not necessarily comparable.
export const REVIEW_PIPELINE_VERSION = "report-pipeline-v8.0";

// Everything needed to answer "which prompt, model and code produced this
// report". Persisted server-side only; never part of the report payload the
// browser receives.
export type ReviewProvenance = {
  promptVersion: string;
  assessmentVersion?: string;
  assessmentFingerprint?: string;
  assessmentValidationVersion?: string;
  assessmentOrigin?: "live" | "cached_model_response";
  promptVariant: ReviewPromptVariant | "stable" | "v1.6-rc1" | "v1.6-rc2" | "v1.6-rc3" | "v1.6-rc4";
  rubricVersion: string;
  pipelineVersion: string;
  reportPolicyVersion?: string;
  model: string;
  requestedModel: string;
  fallbackUsed: boolean;
  modelConfig: {
    maxOutputTokens: number | null;
    timeoutMs: number;
    fallbackDisabled: boolean;
    responseFormat: string;
    store: boolean;
    maxRetries?: number;
  };
  pricing: ResolvedPricing;
  // Empty when the model respected its own calibration caps.
  calibrationViolations: CalibrationViolation[];
};
