// One model for assessment, report writing, consumer and school analyses.
// Reject stale overrides instead of silently analysing with another model.
export const REVIEW_MODEL = "gpt-6-luna";

export function resolveReviewModel(env: Record<string, string | undefined> = process.env): typeof REVIEW_MODEL {
  const configured = env.OPENAI_REVIEW_MODEL?.trim();
  if (configured && configured !== REVIEW_MODEL) throw new Error("OPENAI_NOT_CONFIGURED");
  return REVIEW_MODEL;
}
