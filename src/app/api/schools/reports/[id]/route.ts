import { hasSchoolReportAccess } from "@/lib/schools/access-policy";
import { readSchoolVersions } from "@/lib/schools/revisions";
import { readSchoolPackage } from "@/lib/schools/package";
import { NextResponse } from "next/server";
import { authorizedSchoolAnalysis } from "@/lib/schools/data";
import { privateHeaders, requireSameOrigin, schoolDatabase, SchoolError, schoolFailure } from "@/lib/schools/server";
import { toTeaser, withRecruiterPerspective } from "@/lib/ai/validate-report";
import { hasSchoolTestAccess } from "@/lib/schools/test-access";
import { hmacIdentifier } from "@/lib/security/tokens";
type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const access = await authorizedSchoolAnalysis(request, id);
    const item = access.analysis;
    const testAccess = hasSchoolTestAccess(request, access.member, access.groupId);
    const entitlement = await readSchoolPackage(access.groupId);
    const fullAccess = hasSchoolReportAccess(item.paid, entitlement, testAccess);
    const versions = await readSchoolVersions(item, fullAccess, new URL(request.url).searchParams.get("version"));
    return NextResponse.json({ paid: item.paid, fullAccess, testAccess, ...versions, ...(fullAccess ? { answerScope: hmacIdentifier(`school-answers:${access.member.schoolId}:${access.member.userId}:${id}`) } : {}), report: fullAccess ? withRecruiterPerspective(versions.report) : toTeaser(item.report), expiresAt: item.expiresAt.toISOString() }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await authorizedSchoolAnalysis(request, (await context.params).id);
    return NextResponse.json({ error: "SCHOOL_CHECKOUT_DISABLED", message: "Pełny raport udostępniamy po aktywacji dostępu szkoły na podstawie faktury." }, { status: 410, headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const item = (await authorizedSchoolAnalysis(request, (await context.params).id)).analysis;
    const { error } = await schoolDatabase().from("analyses").delete().eq("id", item.id);
    if (error) throw new SchoolError(503, "Nie udało się usunąć raportu.");
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
