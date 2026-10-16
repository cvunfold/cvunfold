import { requireSameOrigin } from "@/lib/schools/server";
import { randomUUID } from "node:crypto";
import { sendFeedbackNotification } from "@/lib/feedback-mail";
import { FeedbackConflict } from "@/lib/data/feedback";
import { rateLimit } from "@/lib/security/rate-limit";
import { reportRequestMatches } from "@/lib/security/report-session";
import { hasReportCodeAccess } from "@/lib/security/report-access-code";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addAnalysisFeedback, getAnalysis, getReportRevisions, recordFunnelEvent } from "@/lib/data/store";
import { reportTokenFromRequest } from "@/lib/security/report-session";
import { measurementContextFromAttribution } from "@/lib/audience";

const schema = z.object({ version: z.number().int().min(0).max(2).default(0), requestId: z.string().uuid().optional(), rating: z.number().int().min(1).max(5), accurate: z.enum(["yes", "partly", "no"]), issueId: z.string().max(50).optional(), comment: z.string().max(1000).optional() });

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  try { requireSameOrigin(request); } catch { return NextResponse.json({ error: "FEEDBACK_ORIGIN_REQUIRED" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_FEEDBACK" }, { status: 400 });
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  if (!item.paid && !hasReportCodeAccess(item)) return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 403 });
  if (parsed.data.version > 0) {
    try { const versions = await getReportRevisions(item); if (!versions.some(version => version.version === parsed.data.version && version.status === "complete" && version.report)) return NextResponse.json({ error: "VERSION_NOT_FOUND" }, { status: 404 }); }
    catch { return NextResponse.json({ error: "FEEDBACK_SAVE_FAILED" }, { status: 503 }); }
  }
  if (!rateLimit(`report-feedback:${item.id}`, 3, 600_000)) return NextResponse.json({ error: "FEEDBACK_RATE_LIMIT" }, { status: 429 });
  const requestId = parsed.data.requestId || randomUUID();
  try {
    if (!await addAnalysisFeedback(token, parsed.data, requestId, parsed.data.version)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof FeedbackConflict ? "FEEDBACK_REQUEST_REUSED" : "FEEDBACK_SAVE_FAILED" }, { status: error instanceof FeedbackConflict ? 409 : 503 }); }
  await recordFunnelEvent({ name: "feedback_submitted", dedupeKey: `feedback:${requestId}`, analysisId: item.id, locale: item.locale, market: item.market,
    properties: { plan: item.plan, ...measurementContextFromAttribution(item.attribution) } }).catch(() => undefined);
  if (!await sendFeedbackNotification({ ...parsed.data, requestId, source: "individual", locale: item.locale, issueSpecific: Boolean(parsed.data.issueId) })) return NextResponse.json({ saved: true, error: "FEEDBACK_NOTIFICATION_FAILED" }, { status: 503 });
  return NextResponse.json({ ok: true, sent: true });
}
