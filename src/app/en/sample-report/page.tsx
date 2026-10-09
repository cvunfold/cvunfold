import type { Metadata } from "next";
import { CareerSamplePage } from "@/components/career-sample-page";

export const metadata: Metadata = { title: "Full sample Frontend Developer CV report", description: "Sample reports from a first job to Lead: projects, skills, experience, evidence and a fact-safe action plan.", alternates: { canonical: "/en/sample-report", languages: { "pl-PL": "/przykladowy-raport", en: "/en/sample-report", "x-default": "/przykladowy-raport" } } };
export default async function Page({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const params = await searchParams;
  return <CareerSamplePage locale="en" profile={params.profile}/>;
}
