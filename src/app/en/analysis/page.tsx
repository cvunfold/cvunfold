import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";

export const metadata: Metadata = {
  title: "Private developer CV review",
  description: "Upload your CV and see what level, ownership and impact the document communicates.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams;
  return <UploadFlow mockMode={process.env.MOCK_MODE === "true"} initialJobMatch={Boolean(job)} locale="en"/>;
}
