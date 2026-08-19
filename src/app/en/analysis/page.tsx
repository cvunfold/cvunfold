import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";
import { parseHandoffOrigin } from "@/lib/audience";
import { parseTargetRoleId } from "@/lib/roles";
import { parseSeniority } from "@/lib/rubrics/technical-v1";

export const metadata: Metadata = {
  title: "Private developer CV review",
  description: "Upload your CV and see how the document presents your experience, responsibility and impact.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};

type SearchParams = { role?: string; seniority?: string; handoff?: string; handoff_origin?: string };

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <UploadFlow
    mockMode={process.env.MOCK_MODE === "true"}
    initialRole={parseTargetRoleId(params.role) || "frontend_developer"}
    initialSeniority={parseSeniority(params.seniority) || "auto"}
    handoffFromMobile={params.handoff === "mobile"}
    initialHandoffOrigin={parseHandoffOrigin(params.handoff_origin) || undefined}
    locale="en"
  />;
}
