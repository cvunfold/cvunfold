import { ReportView } from "./report-view";
import { createCareerSample, parseCareerSample } from "@/lib/ai/career-samples";
import { sampleReport, sampleProfile } from "@/lib/ai/sample-report";
import { sampleReportEn, sampleProfileEn } from "@/lib/ai/sample-report-en";
import { type Locale } from "@/lib/i18n";
import { DEFAULT_MEASUREMENT_CONTEXT } from "@/lib/audience";

export function CareerSamplePage({ locale, profile }: { locale: Locale; profile?: string }) {
  const id = parseCareerSample(profile);
  const report = id === "senior" ? (locale === "pl" ? sampleReport : sampleReportEn) : createCareerSample(id, locale);
  const demo = id === "senior" ? (locale === "pl" ? sampleProfile : sampleProfileEn) : {
    name: locale === "pl" ? "Przykład fikcyjny" : "Fictional example",
    note: locale === "pl" ? "Dane fikcyjne. Wynik dotyczy CV względem wybranego poziomu." : "Fictional data. The score assesses the CV against the selected level.",
    evidence: report.evidenceMap || {},
  };
  return <>
    <ReportView paid data={report} mockMode={false} locale={locale} demo={demo} measurementContext={{ ...DEFAULT_MEASUREMENT_CONTEXT, selected_seniority_enum: report.document.targetSeniority }}/>
  </>;
}
