import { NextResponse } from "next/server";
import { getAnalysis, track, updateAnalysis } from "@/lib/data/store";
import { z } from "zod";

const schema = z.object({ rating: z.number().int().min(1).max(5), accurate: z.enum(["yes", "partly", "no"]), issueId: z.string().max(50).optional(), comment: z.string().max(1000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; if (!getAnalysis(token)) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  const feedback = schema.parse(await request.json()); updateAnalysis(token, (item) => item.feedback.push(feedback)); track("feedback_submitted");
  return NextResponse.json({ ok: true });
}
