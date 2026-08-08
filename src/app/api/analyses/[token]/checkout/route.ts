import { NextResponse } from "next/server";
import { getAnalysis, markAnalysisPaid, track } from "@/lib/data/store";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  track("checkout_started");
  if (process.env.MOCK_MODE !== "true" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Stripe Checkout wymaga konfiguracji środowiska testowego." }, { status: 503 });
  }
  await markAnalysisPaid(token); track("purchase_completed");
  return NextResponse.json({ unlocked: true });
}
