import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";
import { parseHandoffOrigin } from "@/lib/audience";
import { isPlan } from "@/lib/plans";
import { parseTargetRoleId } from "@/lib/roles";
import { parseSeniority } from "@/lib/rubrics/technical-v1";

export const metadata: Metadata = {
  title: "Prywatna analiza CV developera",
  description: "Prześlij CV i zobacz, jak dokument pokazuje Twoje doświadczenie, odpowiedzialność i wpływ.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};

type SearchParams = { job?: string; plan?: string; role?: string; seniority?: string; handoff?: string; handoff_origin?: string };

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <UploadFlow
    mockMode={process.env.MOCK_MODE === "true"}
    initialJobMatch={isPlan(params.plan) ? params.plan === "job_match" : params.job === "1"}
    initialRole={parseTargetRoleId(params.role) || "frontend_developer"}
    initialSeniority={parseSeniority(params.seniority) || "auto"}
    handoffFromMobile={params.handoff === "mobile"}
    initialHandoffOrigin={parseHandoffOrigin(params.handoff_origin) || undefined}
    locale="pl"
  />;
}
