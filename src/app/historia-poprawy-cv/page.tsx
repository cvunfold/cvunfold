import { publicSocialMetadata } from "@/lib/public-page-metadata";
import type { Metadata } from "next";
import { CvImprovementStory } from "@/components/cv-improvement-story";
export const metadata: Metadata = {
  ...publicSocialMetadata("pl", { title: "Historia poprawy CV: 40 → 64 → 81/100", description: "Dwie iteracje poprawy fikcyjnego CV Natalii: pytania, odpowiedzi i konkretne zmiany bez nowego doświadczenia.", path: "/historia-poprawy-cv" }),
 title: "Historia poprawy CV: 40 → 64 → 81/100", description: "Dwie iteracje poprawy fikcyjnego CV Natalii: pytania, odpowiedzi i konkretne zmiany bez nowego doświadczenia.", alternates: { canonical: "/historia-poprawy-cv", languages: { "pl-PL": "/historia-poprawy-cv", en: "/en/cv-improvement-story" } } };
export default function Page() { return <CvImprovementStory locale="pl"/>; }
