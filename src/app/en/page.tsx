import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Developer CV review: first impression and clear next steps | ${brand.name}`;
const description = "See what a hiring manager understands from your CV. Get an evidence-based review of responsibility, impact, technical credibility and clear next steps.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/en", languages: { "pl-PL": "/", en: "/en", "x-default": "/" } },
  openGraph: { title, description, url: "/en", locale: "en_US", type: "website", siteName: brand.name },
  twitter: { card: "summary_large_image", title, description, images: ["/en/opengraph-image"] },
};
export default function Page() { return <LandingPage locale="en"/>; }
