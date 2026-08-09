import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ReportView } from "@/components/report-view";
import { sampleProfile, sampleReport } from "@/lib/ai/sample-report";
import { SITE_LANGUAGE, SITE_LOCALE, SITE_NAME, WEBSITE_ID, absoluteUrl } from "@/lib/seo";

const description = "Zobacz pełny przykładowy raport CVUnfold: pierwsze wrażenie, seniority, dowody z CV, problemy, ATS i priorytetowy plan poprawek.";

export const metadata: Metadata = {
  title: "Przykładowy raport CV Frontend Developera",
  description,
  alternates: { canonical: "/pl/przykladowy-raport" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website", locale: SITE_LOCALE, siteName: SITE_NAME, url: "/pl/przykladowy-raport",
    title: "Przykładowy raport CV Frontend Developera · CVUnfold", description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Przykładowy raport CVUnfold" }],
  },
  twitter: { card: "summary_large_image", title: "Przykładowy raport CV · CVUnfold", description, images: [{ url: "/opengraph-image", alt: "Przykładowy raport CVUnfold" }] },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${absoluteUrl("/pl/przykladowy-raport")}#webpage`,
  url: absoluteUrl("/pl/przykladowy-raport"),
  name: "Przykładowy raport CV Frontend Developera",
  description,
  isPartOf: { "@id": WEBSITE_ID },
  inLanguage: SITE_LANGUAGE,
  mainEntity: { "@type": "CreativeWork", name: "Przykładowa analiza CV Marty Nowak", isFamilyFriendly: true },
};

export default function SampleReportPage() {
  return <><JsonLd data={structuredData} /><ReportView token="sample" paid data={sampleReport} mockMode={false} demo={sampleProfile} /></>;
}
