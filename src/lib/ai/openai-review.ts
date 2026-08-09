import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { reportSchema, type CVReport } from "./schemas/report";
import { applyServerRubric, validateEvidence } from "./validate-report";
import type { Segment } from "@/lib/document-parsing";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./prompts/review-pl-v3";

type ReviewInput = { segments: Segment[]; targetRole: TargetRoleId; targetSeniority: Seniority; jobDescription?: string; locale: "pl" | "en" };

export async function reviewWithOpenAI(input: ReviewInput): Promise<CVReport> {
  const apiKey = process.env.OPENAI_API_KEY; const model = process.env.OPENAI_REVIEW_MODEL;
  if (!apiKey || !model) throw new Error("OPENAI_NOT_CONFIGURED");
  const client = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 2 });
  const roleProfile = getTargetRoleProfile(input.targetRole);
  const rubric = getRubric(input.targetSeniority, input.targetRole);
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
    requiredPromptVersion: PROMPT_VERSION,
    rubric,
    evidence: input.segments,
    jobDescription: input.jobDescription || null,
  };
  const response = await client.responses.parse({
    model,
    store: false,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Przeanalizuj poniższe dane i przygotuj raport zgodny z systemowym celem oraz schematem:\n${JSON.stringify(payload)}` },
    ],
    text: { format: zodTextFormat(reportSchema, "cv_report") },
  });
  if (!response.output_parsed) throw new Error("OPENAI_INVALID_RESPONSE");
  const normalized = applyServerRubric({
    ...response.output_parsed,
    rubricVersion: RUBRIC_VERSION,
    promptVersion: PROMPT_VERSION,
    document: {
      ...response.output_parsed.document,
      targetRole: roleProfile.label,
      targetSeniority: input.targetSeniority,
    },
  }, rubric);
  return validateEvidence(normalized, new Set(input.segments.map((segment) => segment.id)));
}
