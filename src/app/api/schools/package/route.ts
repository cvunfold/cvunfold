import { NextResponse } from "next/server";
import { requireSchoolGroup, requireSameOrigin, requireSchool, privateHeaders, schoolFailure, SchoolError } from "@/lib/schools/server";
import { readSchoolPackage } from "@/lib/schools/package";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); await requireSchool(request);
    return NextResponse.json({ error: "SCHOOL_CHECKOUT_DISABLED", message: "Szkoły rozliczamy na podstawie faktury. Skontaktuj się z CVUnfold w sprawie aktywacji dostępu." }, { status: 410, headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("group") || "";
    if (!z.string().uuid().safeParse(id).success) throw new SchoolError(400, "Wybierz poprawną grupę.");
    await requireSchoolGroup(request, id);
    return NextResponse.json(await readSchoolPackage(id), { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
