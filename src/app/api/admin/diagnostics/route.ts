import { NextResponse } from "next/server";
import { clampWindowDays, diagnostics } from "@/lib/data/store";
import { isRuntimeEnvironment } from "@/lib/runtime-environment";
import { constantTimeEqual } from "@/lib/security/tokens";
export async function GET(request: Request) {
  const expected = process.env.ADMIN_SECRET; const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestUrl = new URL(request.url);
  const requestedDays = requestUrl.searchParams.get("days");
  if (requestedDays !== null && !/^\d{1,3}$/.test(requestedDays)) {
    return NextResponse.json({ error: "days must be a whole number of days between 1 and 90" }, { status: 400 });
  }
  const requestedEnvironment = requestUrl.searchParams.get("environment");
  if (requestedEnvironment !== null && !isRuntimeEnvironment(requestedEnvironment)) {
    return NextResponse.json({ error: "environment must be production, preview, development or legacy_unknown" }, { status: 400 });
  }
  const windowDays = requestedDays === null ? 1 : clampWindowDays(requestedDays);
  return NextResponse.json(await diagnostics({ windowDays, runtimeEnvironment: requestedEnvironment || undefined }), { headers: { "Cache-Control": "no-store" } });
}
