import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Analiza CV programisty online i test ATS | ${brand.name}`;
const description = "Sprawdź CV programisty po polsku lub angielsku. Bezpłatnie: test czytelności ATS, pierwsze wrażenie i jedna poprawka z cytatem. Pełny raport jest płatny.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/", languages: { "pl-PL": "/", en: "/en", "x-default": "/" } },
  openGraph: { title, description, url: "/", locale: "pl_PL", type: "website", siteName: brand.name },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};
export default function Page() { return <LandingPage locale="pl"/>; }
