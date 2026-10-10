import { parseCareerContext } from "@/lib/ai/career-context";
import type { Metadata } from "next";
import { UploadFlow } from "@/components/upload-flow";
import { parseHandoffOrigin } from "@/lib/audience";
import { parseTargetRoleId } from "@/lib/roles";
import { parseSeniority } from "@/lib/rubrics/technical-v1";

export const metadata: Metadata = {
  title: "Prywatna analiza CV developera",
  description: "Prześlij CV i zobacz, jak dokument pokazuje Twoje doświadczenie, odpowiedzialność i wpływ.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};

type SearchParams = { role?: string; seniority?: string; handoff?: string; handoff_origin?: string; careerContext?: string };

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const parsedStage = parseSeniority(params.seniority);
  const selected = parsedStage === "auto" ? null : parsedStage;
  const stage = parseCareerContext(params.careerContext) === "first_job" && (!selected || selected === "junior") ? "first_job" : selected;
  return <UploadFlow
    mockMode={process.env.MOCK_MODE === "true"}
    initialRole={parseTargetRoleId(params.role) || "frontend_developer"}
    initialSeniority={stage}
    handoffFromMobile={params.handoff === "mobile"}
    initialHandoffOrigin={parseHandoffOrigin(params.handoff_origin) || undefined}
    locale="pl"
  />;
}
