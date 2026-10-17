import type { Metadata } from "next";
import { MethodologyPage } from "@/components/methodology-page";
import { brand } from "@/lib/brand";

const title = `Jak działa analiza CV: metodologia i autor | ${brand.name}`;
const description = "Poznaj kryteria analizy seniority, ownershipu i wpływu, sposób kontroli dowodów oraz doświadczenie osoby odpowiedzialnej za CV Unfold.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/o-metodologii", languages: { "pl-PL": "/o-metodologii", en: "/en/methodology", "x-default": "/o-metodologii" } },
  openGraph: { title, description, url: "/o-metodologii", type: "profile", locale: "pl_PL", siteName: brand.name, images: [{ url: "/images/pawel-maczka-czarnecki.png", width: 512, height: 512, alt: "Paweł Mączka-Czarnecki: twórca CV Unfold" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/pawel-maczka-czarnecki.png"] },
};

export default function Page() { return <MethodologyPage locale="pl"/>; }
