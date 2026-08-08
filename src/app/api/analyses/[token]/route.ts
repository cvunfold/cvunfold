import { NextResponse } from "next/server";
import { deleteAnalysis, getAnalysis, track } from "@/lib/data/store";
import { toTeaser } from "@/lib/ai/validate-report";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = getAnalysis(token);
  if (!item) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  return NextResponse.json(item.paid ? { paid: true, report: item.report } : { paid: false, report: toTeaser(item.report) });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; track("delete_requested");
  return deleteAnalysis(token) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
}
