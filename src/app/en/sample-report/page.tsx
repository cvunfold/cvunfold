import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";
import { sampleProfileEn, sampleReportEn } from "@/lib/ai/sample-report-en";

export const metadata: Metadata = { title: "Full sample Frontend Developer CV report", description: "A synthetic report showing seniority, the first 20 seconds, ownership, evidence and a fact-safe action plan.", alternates: { canonical: "/en/sample-report", languages: { "pl-PL": "/przykladowy-raport", en: "/en/sample-report" } } };
export default function Page() { return <ReportView paid data={sampleReportEn} mockMode={false} locale="en" demo={sampleProfileEn}/>; }
