import { NextResponse } from "next/server";
import { clampWindowDays, diagnostics } from "@/lib/data/store";
import { constantTimeEqual } from "@/lib/security/tokens";
export async function GET(request: Request) {
  const expected = process.env.ADMIN_SECRET; const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestedDays = new URL(request.url).searchParams.get("days");
  if (requestedDays !== null && !/^\d{1,3}$/.test(requestedDays)) {
    return NextResponse.json({ error: "days must be a whole number of days between 1 and 90" }, { status: 400 });
  }
  const windowDays = requestedDays === null ? 1 : clampWindowDays(requestedDays);
  return NextResponse.json(await diagnostics({ windowDays }), { headers: { "Cache-Control": "no-store" } });
}
