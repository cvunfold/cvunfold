import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";
export const metadata: Metadata = { title: "Analiza CV", robots: { index: false, follow: false } };
export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams;
  return <UploadFlow mockMode={process.env.MOCK_MODE === "true"} initialJobMatch={Boolean(job)}/>;
}
