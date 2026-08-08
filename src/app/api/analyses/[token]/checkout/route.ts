import { NextResponse } from "next/server";
import { getAnalysis, markAnalysisPaid, track } from "@/lib/data/store";
import { createCheckout } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "Nie znaleziono raportu." }, { status: 404 });
  if (item.paid) return NextResponse.json({ paid: true });
  track("checkout_started");
  if (process.env.MOCK_MODE === "true" && process.env.NODE_ENV !== "production") {
    await markAnalysisPaid(token); track("purchase_completed");
    return NextResponse.json({ unlocked: true });
  }
  try {
    return NextResponse.json({ url: await createCheckout(item, token) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "STRIPE_CHECKOUT_FAILED";
    const configurationError = ["STRIPE_NOT_CONFIGURED", "STRIPE_PRICE_NOT_CONFIGURED", "APP_URL_NOT_CONFIGURED", "APP_URL_NOT_SECURE"].includes(code);
    return NextResponse.json({ error: configurationError ? "Płatności nie są jeszcze skonfigurowane." : "Nie udało się rozpocząć płatności. Spróbuj ponownie." }, { status: configurationError ? 503 : 502 });
  }
}
