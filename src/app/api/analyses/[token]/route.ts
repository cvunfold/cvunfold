import { NextResponse } from "next/server";

export function GET() { return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 410 }); }
export function DELETE() { return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 410 }); }
