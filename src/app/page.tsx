import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Analiza CV developera: pierwsze wrażenie i konkretne wskazówki | ${brand.name}`;
const description = "Sprawdź, co hiring manager zrozumie z Twojego CV. Otrzymaj analizę odpowiedzialności, wpływu, wiarygodności technicznej i konkretne dowody z dokumentu.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/", languages: { "pl-PL": "/", en: "/en", "x-default": "/" } },
  openGraph: { title, description, url: "/", locale: "pl_PL", type: "website", siteName: brand.name },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};
export default function Page() { return <LandingPage locale="pl"/>; }
