import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { brand } from "@/lib/brand";

const title = `Analiza CV developera: seniority, ownership i pierwsze wrażenie | ${brand.name}`;
const description = "Sprawdź, czy CV pokazuje Twój rzeczywisty poziom. Otrzymaj analizę seniority, ownershipu, wpływu i pierwszych 20 sekund hiring managera.";

export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "/", languages: { "pl-PL": "/", "en": "/en" } }, openGraph: { title, description, url: "/", locale: "pl_PL", type: "website" } };
export default function Page() { return <LandingPage locale="pl"/>; }
