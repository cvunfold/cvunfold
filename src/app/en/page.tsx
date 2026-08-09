import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Developer CV review: seniority and first impression | ${brand.name}`;
const description = "See whether your CV communicates your real level. Get an evidence-based review of seniority, ownership, impact and a hiring manager's first 20 seconds.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/en", languages: { "pl-PL": "/", en: "/en" } },
  openGraph: { title, description, url: "/en", locale: "en_US", type: "website", siteName: brand.name },
  twitter: { card: "summary_large_image", title, description, images: ["/en/opengraph-image"] },
};
export default function Page() { return <LandingPage locale="en"/>; }
