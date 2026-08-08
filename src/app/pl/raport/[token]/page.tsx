import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnalysis, track } from "@/lib/data/store";
import { toTeaser } from "@/lib/ai/validate-report";
import { ReportView } from "@/components/report-view";
import { fulfillCheckoutSession } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Twój raport CV", robots: { index: false, follow: false, nocache: true } };

export default async function ReportPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { token } = await params; let item = await getAnalysis(token); if (!item) notFound();
  const { session_id: sessionId } = await searchParams;
  if (!item.paid && sessionId && process.env.MOCK_MODE !== "true") {
    try { await fulfillCheckoutSession(sessionId, `checkout-verify:${sessionId}`, item.id); item = await getAnalysis(token) || item; } catch { /* Webhook retry remains authoritative. */ }
  }
  track(item.paid ? "full_report_viewed" : "teaser_viewed");
  return <ReportView token={token} paid={item.paid} data={item.paid ? item.report : toTeaser(item.report)} mockMode={process.env.MOCK_MODE === "true"}/>;
}
