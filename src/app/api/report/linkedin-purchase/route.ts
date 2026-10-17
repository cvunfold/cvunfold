import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/data/store";
import { linkedInConversionsConfigured, sendLinkedInPurchase } from "@/lib/analytics/linkedin-server";
import { MEASUREMENT_CONSENT_VERSION, validLinkedInClickId } from "@/lib/analytics/linkedin-shared";
import { reportRequestMatches, reportTokenFromRequest } from "@/lib/security/report-session";
import { hasReportTestAccess } from "@/lib/security/report-test-access";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/tokens";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const result = (status: number, sent = false) => NextResponse.json({ sent }, { status, headers });

export async function POST(request: Request) {
  if (!linkedInConversionsConfigured()) return result(503);
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return result(403);
  const token = reportTokenFromRequest(request);
  if (!token) return result(401);
  if (!rateLimit(`linkedin-purchase:${hashToken(token)}`, 6, 60_000)) return result(429);
  if (Number(request.headers.get("content-length")) > 512) return result(400);
  let input: { clickId?: unknown; consentVersion?: unknown };
  try {
    const body = await request.text();
    if (body.length > 512) return result(400);
    input = JSON.parse(body);
  } catch { return result(400); }
  if (!input || input.consentVersion !== MEASUREMENT_CONSENT_VERSION || !validLinkedInClickId(input.clickId)) return result(400);
  const item = await getAnalysis(token);
  if (!item || !reportRequestMatches(request, item.id)) return result(404);
  if (!item.paid || !item.purchase || item.schoolGroupId || hasReportTestAccess(request, token)) return result(200);
  try { return result(200, await sendLinkedInPurchase(item.purchase, input.clickId)); }
  catch { return result(502); }
}
