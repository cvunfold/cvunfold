import type { Metadata } from "next";
import { ReportSessionPage } from "@/components/report-session-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Twój prywatny raport CV", referrer: "no-referrer", robots: { index: false, follow: false, nocache: true, noimageindex: true } };

export default function ReportPage() {
  return <ReportSessionPage locale="pl" mockMode={process.env.MOCK_MODE === "true"}/>;
}
