import type { Metadata } from "next";
import { CareerSamplePage } from "@/components/career-sample-page";

export const metadata: Metadata = { title: "Pełny przykładowy raport CV Frontend Developera", description: "Przykładowe raporty od pierwszej pracy po Lead: projekty, umiejętności, doświadczenie, dowody i bezpieczny plan zmian.", alternates: { canonical: "/przykladowy-raport", languages: { "pl-PL": "/przykladowy-raport", en: "/en/sample-report", "x-default": "/przykladowy-raport" } } };
export default async function Page({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const params = await searchParams;
  return <CareerSamplePage locale="pl" profile={params.profile}/>;
}
