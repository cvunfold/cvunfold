import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";
import { sampleProfile, sampleReport } from "@/lib/ai/sample-report";

export const metadata: Metadata = { title: "Pełny przykładowy raport CV Frontend Developera", description: "Syntetyczny przykład raportu: seniority, pierwsze 20 sekund, ownership, dowody i bezpieczny plan zmian.", alternates: { canonical: "/przykladowy-raport", languages: { "pl-PL": "/przykladowy-raport", en: "/en/sample-report", "x-default": "/przykladowy-raport" } } };
export default function Page() { return <ReportView paid data={sampleReport} mockMode={false} locale="pl" demo={sampleProfile}/>; }
