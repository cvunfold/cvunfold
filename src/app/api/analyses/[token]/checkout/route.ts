import { NextResponse } from "next/server";
import { getAnalysis, track, updateAnalysis } from "@/lib/data/store";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = getAnalysis(token);
  if (!item) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  track("checkout_started");
  if (process.env.MOCK_MODE !== "true" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Stripe Checkout wymaga konfiguracji środowiska testowego." }, { status: 503 });
  }
  updateAnalysis(token, (analysis) => { analysis.paid = true; }); track("purchase_completed");
  return NextResponse.json({ unlocked: true });
}
