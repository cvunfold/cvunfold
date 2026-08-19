import { getSafeOpenAIErrorDiagnostic } from "@/lib/ai/openai-review";
import { getUnreadableDocumentDiagnostics } from "@/lib/document-parsing";
import { getNotACvDiagnostics } from "@/lib/document-parsing/cv-detection";

function safeRequestId(value: string | null): string | undefined {
  return value && /^[a-zA-Z0-9:._-]{1,120}$/.test(value) ? value : undefined;
}

export function buildSafeAnalysisFailureLog(input: {
  code: string;
  durationMs: number;
  error: unknown;
  requestId: string | null;
}) {
  const extraction = getUnreadableDocumentDiagnostics(input.error);
  const notACv = getNotACvDiagnostics(input.error);
  const requestId = safeRequestId(input.requestId);
  return {
    level: "error" as const,
    event: "analysis_failed" as const,
    route: "/api/analyses" as const,
    code: input.code,
    duration_ms: Math.max(0, Math.round(input.durationMs)),
    ...(requestId ? { request_id: requestId } : {}),
    ...(extraction ? { extraction }
      : notACv ? { not_a_cv: notACv }
      : { diagnostic: getSafeOpenAIErrorDiagnostic(input.error) }),
  };
}
