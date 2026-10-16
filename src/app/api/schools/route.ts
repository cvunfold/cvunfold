import { NextResponse } from "next/server";
import { z } from "zod";
import { readSchoolData } from "@/lib/schools/data";
import { privateHeaders, requireSameOrigin, requireSchool, schoolDatabase, SchoolError, schoolFailure } from "@/lib/schools/server";
import { parseTargetRoleId } from "@/lib/roles";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return NextResponse.json(await readSchoolData(request, new URL(request.url).searchParams.get("group") || undefined), { headers: privateHeaders }); }
  catch (error) { return schoolFailure(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const member = await requireSchool(request);
    if (!rateLimit(`school-groups:${member.schoolId}`, 5)) throw new SchoolError(429, "Spróbuj ponownie za chwilę.");
    const body = z.object({ name: z.string().trim().min(1).max(120), role: z.string(), seniority: z.enum(["first_job", "junior"]) }).safeParse(await request.json());
    if (!body.success || !parseTargetRoleId(body.data.role)) throw new SchoolError(400, "Podaj nazwę grupy, rolę i poziom.");
    const { error } = await schoolDatabase().from("school_groups").insert({ school_id: member.schoolId,
      name: body.data.name, target_role: body.data.role, target_seniority: body.data.seniority });
    if (error) throw new SchoolError(503, "Nie udało się utworzyć grupy.");
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const member = await requireSchool(request);
    const body = z.object({ groupId: z.string().uuid(), confirmed: z.literal(true) }).safeParse(await request.json().catch(() => null));
    if (!body.success) throw new SchoolError(400, "Potwierdź usunięcie wybranej grupy.");
    if (!rateLimit(`school-group-delete:${member.schoolId}`, 5)) throw new SchoolError(429, "Spróbuj ponownie za chwilę.");
    // Ownership is part of the mutation itself. Foreign keys cascade to analyses and reports.
    const { data, error } = await schoolDatabase().from("school_groups").delete()
      .eq("id", body.data.groupId).eq("school_id", member.schoolId).select("id").maybeSingle();
    if (error) throw new SchoolError(503, "Nie udało się usunąć grupy.");
    if (!data) throw new SchoolError(404, "Nie znaleziono grupy.");
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
