import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";

export const metadata: Metadata = {
  title: "Prywatna analiza CV developera",
  description: "Prześlij CV i zobacz, jaki poziom, ownership i wpływ komunikuje dokument.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams;
  return <UploadFlow mockMode={process.env.MOCK_MODE === "true"} initialJobMatch={Boolean(job)} locale="pl"/>;
}
