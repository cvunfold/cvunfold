import { after, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireSchool, privateHeaders, schoolDatabase, SchoolError, schoolFailure } from "@/lib/schools/server";
import { createQueuedBatch, commitQueuedBatch, schoolQueueEnabled } from "@/lib/schools/upload-queue";
import { processSchoolQueue } from "@/lib/schools/upload-worker";
import { rateLimit } from "@/lib/security/rate-limit";
export const runtime = "nodejs";
export const maxDuration = 300;
const file = z.object({ name: z.string().min(1).max(255).regex(/\.(pdf|docx)$/i), size: z.number().int().min(1).max(8*1024*1024), studentName: z.string().trim().min(1).max(120), manual: z.boolean() });
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const member = await requireSchool(request);
    if (!rateLimit(`school-batches:${member.schoolId}`, 10)) throw new SchoolError(429, "Spróbuj ponownie za chwilę.");
    const body = z.discriminatedUnion("action", [
      z.object({ action: z.literal("prepare"), groupId: z.string().uuid(), requestId: z.string().uuid(), consent: z.literal(true), files: z.array(file).min(1).max(30).refine(files => files.reduce((sum,f) => sum+f.size,0)<=100*1024*1024) }),
      z.object({ action: z.literal("commit"), batchId: z.string().uuid() }),
      z.object({ action: z.literal("cancel"), requestId: z.string().uuid() }),
    ]).safeParse(await request.json());
    if (!body.success) throw new SchoolError(400, "Wybierz do 30 CV, maksymalnie 8 MB na plik i 100 MB na paczkę, oraz potwierdź zgodę.");
    if (body.data.action === "cancel") {
      const canceled = await schoolDatabase().rpc("cancel_school_upload_batch", { p_school_id: member.schoolId, p_user_id: member.userId, p_request_id: body.data.requestId });
      if (canceled.error) throw new SchoolError(503, "Nie udało się anulować paczki.");
      if (canceled.data !== true) throw new SchoolError(409, "Paczka została już przekazana do analizy. Ponów zapis paczki albo odśwież panel.");
      return NextResponse.json({ ok: true }, { headers: privateHeaders });
    }
    if (!schoolQueueEnabled() || process.env.MOCK_MODE === "true" || !process.env.OPENAI_API_KEY) throw new SchoolError(503, "Przesyłanie paczek w tle nie jest jeszcze aktywne.");
    if (body.data.action === "prepare") return NextResponse.json(await createQueuedBatch(member, body.data.groupId, body.data.requestId, body.data.files), { headers: privateHeaders });
    await commitQueuedBatch(body.data.batchId, member);
    after(async () => { try { await processSchoolQueue(member.schoolId); } catch { console.error("SCHOOL_QUEUE_BACKGROUND_FAILED"); } });
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
