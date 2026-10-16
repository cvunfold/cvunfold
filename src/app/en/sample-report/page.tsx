import { publicSocialMetadata } from "@/lib/public-page-metadata";
import type { Metadata } from "next";
import { CareerSamplePage } from "@/components/career-sample-page";

export const metadata: Metadata = {
  ...publicSocialMetadata("en", { title: "Full sample IT and AI CV report", description: "Sample reports from a first job to Lead: projects, skills, experience, evidence and a fact-safe action plan.", path: "/en/sample-report" }),
 title: "Full sample IT and AI CV report", description: "Sample reports from a first job to Lead: projects, skills, experience, evidence and a fact-safe action plan.", alternates: { canonical: "/en/sample-report", languages: { "pl-PL": "/przykladowy-raport", en: "/en/sample-report", "x-default": "/przykladowy-raport" } } };
export default async function Page({ searchParams }: { searchParams: Promise<{ profile?: string; role?: string }> }) {
  const params = await searchParams;
  return <CareerSamplePage locale="en" profile={params.profile} role={params.role}/>;
}
