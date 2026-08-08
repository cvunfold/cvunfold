import { NextResponse } from "next/server";
import { diagnostics } from "@/lib/data/store";
import { constantTimeEqual } from "@/lib/security/tokens";
export async function GET(request: Request) {
  const expected = process.env.ADMIN_SECRET; const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !received || !constantTimeEqual(expected, received)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(diagnostics(), { headers: { "Cache-Control": "no-store" } });
}
