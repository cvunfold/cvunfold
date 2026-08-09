import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

export default async function LegacyReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/raport#${encodeURIComponent(token)}`);
}
