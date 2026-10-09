import { reportTestAccessEnabled } from "@/lib/security/report-test-access";
import type { Metadata } from "next";
import { ReportSessionPage } from "@/components/report-session-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your private CV report", referrer: "no-referrer", robots: { index: false, follow: false, nocache: true, noimageindex: true } };

export default function ReportPage() {
  return <ReportSessionPage locale="en" mockMode={process.env.MOCK_MODE === "true"} testAccessEnabled={reportTestAccessEnabled()}/>;
}
