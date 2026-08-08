import { NextResponse } from "next/server";
import { addAnalysisFeedback, track } from "@/lib/data/store";
import { z } from "zod";

const schema = z.object({ rating: z.number().int().min(1).max(5), accurate: z.enum(["yes", "partly", "no"]), issueId: z.string().max(50).optional(), comment: z.string().max(1000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const feedback = schema.parse(await request.json());
  if (!await addAnalysisFeedback(token, feedback)) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  track("feedback_submitted");
  return NextResponse.json({ ok: true });
}
