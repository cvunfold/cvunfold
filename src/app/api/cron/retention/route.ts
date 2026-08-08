import { NextResponse } from "next/server";
import { cleanupExpired } from "@/lib/data/store";
import { constantTimeEqual } from "@/lib/security/tokens";
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET; const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ deleted: await cleanupExpired() });
}
