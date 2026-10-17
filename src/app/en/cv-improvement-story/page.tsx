import { publicSocialMetadata } from "@/lib/public-page-metadata";
import type { Metadata } from "next";
import { CvImprovementStory } from "@/components/cv-improvement-story";
export const metadata: Metadata = {
  ...publicSocialMetadata("en", { title: "A CV improvement story: 40 → 64 → 81/100", description: "Two revisions of Natalia’s fictional CV: questions, answers and specific edits without new experience.", path: "/en/cv-improvement-story" }),
 title: "A CV improvement story: 40 → 64 → 81/100", description: "Two revisions of Natalia’s fictional CV: questions, answers and specific edits without new experience.", alternates: { canonical: "/en/cv-improvement-story", languages: { "pl-PL": "/historia-poprawy-cv", en: "/en/cv-improvement-story" } } };
export default function Page() { return <CvImprovementStory locale="en"/>; }
