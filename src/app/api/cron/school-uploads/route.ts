import { NextResponse } from "next/server";
import { processSchoolQueue } from "@/lib/schools/upload-worker";
import { schoolQueueEnabled, cleanQueueSources } from "@/lib/schools/upload-queue";
import { constantTimeEqual } from "@/lib/security/tokens";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET, received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!schoolQueueEnabled()) {
    try { return NextResponse.json({ enabled: false, cleaned: await cleanQueueSources() }); }
    catch (error) { return NextResponse.json(error instanceof Error && error.message === "QUEUE_NOT_CONFIGURED" ? { enabled: false } : { error: "Cleanup unavailable" }, { status: error instanceof Error && error.message === "QUEUE_NOT_CONFIGURED" ? 200 : 503 }); }
  }
  try { await processSchoolQueue(); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Queue unavailable" }, { status: 503 }); }
}
