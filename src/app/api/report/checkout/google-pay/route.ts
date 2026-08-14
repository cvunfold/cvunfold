import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/data/store";
import { createExpressWalletCheckout } from "@/lib/payments/stripe";
import { reportTokenFromRequest } from "@/lib/security/report-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = reportTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "REPORT_SESSION_REQUIRED" }, { status: 401 });
  const item = await getAnalysis(token);
  if (!item) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
  if (item.paid) return NextResponse.json({ error: "REPORT_ALREADY_PAID" }, { status: 409 });
  if (process.env.MOCK_MODE === "true") return NextResponse.json({ error: "EXPRESS_WALLET_UNAVAILABLE" }, { status: 404 });

  try {
    const clientSecret = await createExpressWalletCheckout(item);
    return NextResponse.json({ clientSecret }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "STRIPE_CHECKOUT_FAILED";
    const configurationError = [
      "STRIPE_NOT_CONFIGURED",
      "STRIPE_PRICE_NOT_CONFIGURED",
      "STRIPE_PRICE_MISMATCH",
      "APP_URL_NOT_CONFIGURED",
      "APP_URL_NOT_SECURE",
    ].includes(code);
    return NextResponse.json(
      { error: configurationError ? "PAYMENTS_NOT_CONFIGURED" : "CHECKOUT_FAILED" },
      { status: configurationError ? 503 : 502 },
    );
  }
}
