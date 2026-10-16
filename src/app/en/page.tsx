import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Software Engineer CV Review and ATS Check | ${brand.name}`;
const description = "Review your developer CV or resume in English or Polish. Get a free ATS readability check and one improvement backed by a quote. The full review is paid.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/en", languages: { "pl-PL": "/", en: "/en", "x-default": "/" } },
  openGraph: { title, description, url: "/en", locale: "en_US", type: "website", siteName: brand.name },
  twitter: { card: "summary_large_image", title, description, images: ["/en/opengraph-image"] },
};
export default function Page() { return <LandingPage locale="en"/>; }
