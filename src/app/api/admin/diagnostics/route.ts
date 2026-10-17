import { NextResponse } from "next/server";
import { clampWindowDays, diagnostics } from "@/lib/data/store";
import { NO_EVIDENCE_SCORE, REPORT_POLICY_VERSION } from "@/lib/ai/report-policy";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
import { RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { activePromptVariant } from "@/lib/ai/prompts";
import { isRuntimeEnvironment, runtimeEnvironmentFrom } from "@/lib/runtime-environment";
import { constantTimeEqual } from "@/lib/security/tokens";
import { resolveReviewModel } from "@/lib/ai/model-config";
export async function GET(request: Request) {
  const expected = process.env.ADMIN_SECRET; const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("configuration") === "1") return NextResponse.json({
    runtimeEnvironment: runtimeEnvironmentFrom(),
    reviewModel: resolveReviewModel(),
    promptVariant: activePromptVariant(),
    rubricVersion: RUBRIC_VERSION,
    pipelineVersion: REVIEW_PIPELINE_VERSION,
    reportPolicyVersion: REPORT_POLICY_VERSION,
    noEvidenceScore: NO_EVIDENCE_SCORE,
  }, { headers: { "Cache-Control": "no-store" } });
  const requestedDays = requestUrl.searchParams.get("days");
  if (requestedDays !== null && !/^\d{1,3}$/.test(requestedDays)) {
    return NextResponse.json({ error: "days must be a whole number of days between 1 and 90" }, { status: 400 });
  }
  const requestedEnvironment = requestUrl.searchParams.get("environment");
  if (requestedEnvironment !== null && !isRuntimeEnvironment(requestedEnvironment)) {
    return NextResponse.json({ error: "environment must be production, preview, development or legacy_unknown" }, { status: 400 });
  }
  const windowDays = requestedDays === null ? 1 : clampWindowDays(requestedDays);
  return NextResponse.json(await diagnostics({ windowDays, runtimeEnvironment: requestedEnvironment || undefined }), { headers: { "Cache-Control": "no-store" } });
}
