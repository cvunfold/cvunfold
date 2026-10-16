import type { Metadata } from "next";
import Link from "next/link";
import { ReportView } from "@/components/report-view";
import { reportSchema } from "@/lib/ai/schemas/report";
import data from "@/lib/ai/cv-story/final-report.json";
import { z } from "zod";
import { ATS_CHECK_IDS } from "@/lib/ats-checker/types";
import { DEFAULT_MEASUREMENT_CONTEXT } from "@/lib/audience";
export const metadata: Metadata = { title: "Raport Natalii po dwóch poprawkach: 81/100", robots: { index: false, follow: true } };
export default function Page() {
  const report = { ...reportSchema.parse(data), evidenceMap: data.evidenceMap, ats: z.object({ score: z.number(), checks: z.array(z.object({ id: z.enum(ATS_CHECK_IDS), status: z.enum(["pass", "warning", "fail", "not_applicable"]), metrics: z.record(z.number()).optional() })) }).parse(data.ats) };
  return <><aside className="container cv-story-sample-link"><Link href="/historia-poprawy-cv">← Historia poprawy CV Natalii: 40 → 64 → 81</Link></aside><ReportView paid data={report} mockMode={false} locale="pl" demo={{ name: "Natalia, fikcyjna kandydatka", note: "Rzeczywisty test fikcyjnego CV. Odpowiedzi symulowane na podstawie rejestru faktów. Wynik dotyczy tego przykładu.", evidence: report.evidenceMap || {} }} measurementContext={DEFAULT_MEASUREMENT_CONTEXT}/></>;
}
