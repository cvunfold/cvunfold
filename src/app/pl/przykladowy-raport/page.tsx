import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";
import { sampleProfile, sampleReport } from "@/lib/ai/sample-report";

export const metadata: Metadata = {
  title: "Przykładowy raport CV Frontend Developera",
  description: "Zobacz pełny przykładowy raport CVUnfold: pierwsze wrażenie, seniority, dowody z CV, problemy, ATS i priorytetowy plan poprawek.",
  robots: { index: true, follow: true },
};

export default function SampleReportPage() {
  return <ReportView token="sample" paid data={sampleReport} mockMode={false} demo={sampleProfile} />;
}
