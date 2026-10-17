import type { Metadata } from "next";
import { MethodologyPage } from "@/components/methodology-page";
import { brand } from "@/lib/brand";

const title = `How the CV review works: methodology and author | ${brand.name}`;
const description = "Explore the seniority, ownership and impact criteria, evidence controls and the experience behind CV Unfold.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/en/methodology", languages: { "pl-PL": "/o-metodologii", en: "/en/methodology", "x-default": "/o-metodologii" } },
  openGraph: { title, description, url: "/en/methodology", type: "profile", locale: "en_US", siteName: brand.name, images: [{ url: "/images/pawel-maczka-czarnecki.png", width: 512, height: 512, alt: "Paweł Mączka-Czarnecki: creator of CV Unfold" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/pawel-maczka-czarnecki.png"] },
};

export default function Page() { return <MethodologyPage locale="en"/>; }
