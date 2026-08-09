import { NextResponse } from "next/server";

export function POST() { return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 410 }); }
