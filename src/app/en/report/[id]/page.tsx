import { ReportSessionPage } from "@/components/report-session-page";
import { reportTestAccessEnabled } from "@/lib/security/report-test-access";
export { metadata, dynamic } from "../page";
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportSessionPage locale="en" analysisId={id} mockMode={process.env.MOCK_MODE === "true"} testAccessEnabled={reportTestAccessEnabled()}/>;
}
