import Link from "next/link";
import { AI_SAMPLE_ROLES, createAiRoleSample, isAiSampleRole } from "@/lib/ai/ai-role-samples";
import { getTargetRoleProfile } from "@/lib/roles";
import { cvStoryPath, sampleReportPath } from "@/lib/i18n";
import { ReportView } from "./report-view";
import { createCareerSample, parseCareerSample } from "@/lib/ai/career-samples";
import { sampleReport, sampleProfile } from "@/lib/ai/sample-report";
import { sampleReportEn, sampleProfileEn } from "@/lib/ai/sample-report-en";
import { type Locale } from "@/lib/i18n";
import { DEFAULT_MEASUREMENT_CONTEXT } from "@/lib/audience";

export function CareerSamplePage({ locale, profile, role }: { locale: Locale; profile?: string; role?: string }) {
  const id = parseCareerSample(profile);
  const aiRole = isAiSampleRole(role) ? role : null;
  const report = aiRole ? createAiRoleSample(aiRole, locale) : id === "senior" ? (locale === "pl" ? sampleReport : sampleReportEn) : createCareerSample(id, locale);
  const demo = !aiRole && id === "senior" ? (locale === "pl" ? sampleProfile : sampleProfileEn) : {
    name: locale === "pl" ? "Przykład fikcyjny" : "Fictional example",
    note: locale === "pl" ? "Dane fikcyjne. Wynik dotyczy CV względem wybranego poziomu." : "Fictional data. The score assesses the CV against the selected level.",
    evidence: report.evidenceMap || {},
  };
  return <>
    <nav className="container cv-story-sample-link" aria-label={locale === "pl" ? "Przykłady specjalizacji AI" : "AI specialisation examples"}>
      {AI_SAMPLE_ROLES.map(sampleRole => <Link key={sampleRole} href={`${sampleReportPath(locale)}?profile=first_job&role=${sampleRole}`} aria-current={aiRole === sampleRole ? "page" : undefined}>{getTargetRoleProfile(sampleRole, locale).label} → </Link>)}
    </nav>
    <aside className="container cv-story-sample-link"><Link href={cvStoryPath(locale)}>{locale === "pl" ? "Zobacz też historię Natalii: 40 → 64 → 81/100" : "See Natalia’s improvement story: 40 → 64 → 81/100"} →</Link></aside>
    <ReportView paid data={report} mockMode={false} locale={locale} demo={demo} measurementContext={{ ...DEFAULT_MEASUREMENT_CONTEXT, selected_seniority_enum: report.document.targetSeniority }}/>
  </>;
}
