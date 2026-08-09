import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnalysis, track } from "@/lib/data/store";
import { toTeaser, withRecruiterPerspective } from "@/lib/ai/validate-report";
import { ReportView } from "@/components/report-view";
import { fulfillCheckoutSession } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Twój prywatny raport CV",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true, noimageindex: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default async function ReportPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ checkout?: string; session_id?: string }> }) {
  const { token } = await params; let item = await getAnalysis(token); if (!item) notFound();
  const { checkout, session_id: sessionId } = await searchParams;
  if (!item.paid && sessionId && process.env.MOCK_MODE !== "true") {
    try { await fulfillCheckoutSession(sessionId, `checkout-verify:${sessionId}`, item.id); item = await getAnalysis(token) || item; } catch { /* Webhook retry remains authoritative. */ }
  }
  track(item.paid ? "full_report_viewed" : "teaser_viewed");
  const report = withRecruiterPerspective(item.report);
  const purchase = item.paid && checkout === "success" && sessionId
    ? { transactionId: sessionId, value: item.plan === "job_match" ? 39 : 29, currency: "PLN" }
    : undefined;
  return <ReportView token={token} paid={item.paid} plan={item.plan} purchase={purchase} data={item.paid ? report : toTeaser(report)} mockMode={process.env.MOCK_MODE === "true"}/>;
}
