import { hasSchoolReportAccess } from "@/lib/schools/access-policy";
import { randomUUID } from "node:crypto";
import { sendFeedbackNotification } from "@/lib/feedback-mail";
import { insertFeedbackOnce, FeedbackConflict } from "@/lib/data/feedback";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizedSchoolAnalysis } from "@/lib/schools/data";
import { readSchoolPackage } from "@/lib/schools/package";
import { readSchoolVersions } from "@/lib/schools/revisions";
import { hasSchoolTestAccess } from "@/lib/schools/test-access";
import { requireSameOrigin, schoolDatabase, privateHeaders, SchoolError, schoolFailure } from "@/lib/schools/server";
import { rateLimit } from "@/lib/security/rate-limit";
const schema = z.object({ requestId: z.string().uuid().optional(), rating: z.number().int().min(1).max(5), accurate: z.enum(["yes","partly","no"]), comment: z.string().max(1000).optional(), version: z.number().int().min(0).max(1) }).strict();
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const { analysis, member, groupId } = await authorizedSchoolAnalysis(request, (await context.params).id);
    const testAccess = hasSchoolTestAccess(request, member, groupId);
    const entitlement = await readSchoolPackage(groupId);
    if (!hasSchoolReportAccess(analysis.paid, entitlement, testAccess)) throw new SchoolError(403, "Ocena jest dostępna po odblokowaniu raportu.");
    if (!rateLimit(`school-feedback:${member.userId}:${analysis.id}`,3,600_000)) throw new SchoolError(429, "Zaczekaj przed kolejną oceną.");
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new SchoolError(400, "Sprawdź formularz oceny.");
    await readSchoolVersions(analysis,true,String(body.data.version));
    const requestId = body.data.requestId || randomUUID();
    if (!testAccess) await insertFeedbackOnce(schoolDatabase(), analysis.id, body.data, requestId, body.data.version);
    if (!await sendFeedbackNotification({ ...body.data, requestId, source: "school", locale: "pl" })) throw new SchoolError(503, testAccess ? "Nie udało się wysłać powiadomienia. Spróbuj ponownie." : "Ocena została zapisana, ale nie udało się wysłać powiadomienia. Ponów wysyłkę.");
    return NextResponse.json({ ok: true, sent: true },{ headers: privateHeaders });
  } catch (error) { return schoolFailure(error instanceof FeedbackConflict ? new SchoolError(409, "Zmieniono treść poprzednio zapisanej oceny. Odśwież formularz.") : error); }
}
