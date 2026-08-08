import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnalysis, track } from "@/lib/data/store";
import { toTeaser } from "@/lib/ai/validate-report";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Twój raport CV", robots: { index: false, follow: false, nocache: true } };

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = getAnalysis(token); if (!item) notFound();
  track(item.paid ? "full_report_viewed" : "teaser_viewed");
  return <ReportView token={token} paid={item.paid} data={item.paid ? item.report : toTeaser(item.report)} mockMode={process.env.MOCK_MODE === "true"}/>;
}
