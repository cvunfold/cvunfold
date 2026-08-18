import type { ReviewPromptVariant } from "./prompts";

// Bump this when the server-side report pipeline changes in a way that can alter
// a stored report for identical model output — segmentation, evidence
// validation, suggestion downgrades or action normalisation. Without it, two
// runs of the same prompt and model are not necessarily comparable.
export const REVIEW_PIPELINE_VERSION = "report-pipeline-v2";

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
    responseFormat: string;
    store: boolean;
  };
};
