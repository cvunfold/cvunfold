import { NextResponse } from "next/server";
import { z } from "zod";
import { addAnalysisFeedback, getAnalysis, recordFunnelEvent } from "@/lib/data/store";
import { reportTokenFromRequest } from "@/lib/security/report-session";

const schema = z.object({ rating: z.number().int().min(1).max(5), accurate: z.enum(["yes", "partly", "no"]), issueId: z.string().max(50).optional(), comment: z.string().max(1000).optional() });

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_FEEDBACK" }, { status: 400 });
  const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  if (!item.paid) return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 403 });
  if (!await addAnalysisFeedback(token, parsed.data)) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  await recordFunnelEvent({ name: "feedback_submitted", analysisId: item.id, locale: item.locale, market: item.market }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
