import type { ReviewPromptVariant } from "./prompts";
import type { ResolvedPricing } from "./model-pricing";
import type { CalibrationViolation } from "./validate-report";

// Bump this when the server-side report pipeline changes in a way that can alter
// a stored report for identical model output — segmentation, evidence
// validation, suggestion downgrades or action normalisation. Without it, two
// runs of the same prompt and model are not necessarily comparable.
export const REVIEW_PIPELINE_VERSION = "report-pipeline-v5";

// Everything needed to answer "which prompt, model and code produced this
// report". Persisted server-side only; never part of the report payload the
// browser receives.
export type ReviewProvenance = {
  promptVersion: string;
  promptVariant: ReviewPromptVariant;
  rubricVersion: string;
  pipelineVersion: string;
  model: string;
  requestedModel: string;
  fallbackUsed: boolean;
  modelConfig: {
    maxOutputTokens: number | null;
    timeoutMs: number;
    fallbackDisabled: boolean;
    responseFormat: string;
    store: boolean;
  };
  pricing: ResolvedPricing;
  // Empty when the model respected its own calibration caps.
  calibrationViolations: CalibrationViolation[];
  // How many ATS findings the server had to drop as out-of-scope. Without this
  // the filter is silent, and "the prompt stopped generating them" looks exactly
  // like "the prompt still generates them and the filter tidies up".
  droppedAtsFindings: number;
};
