import { publicSocialMetadata } from "@/lib/public-page-metadata";
import type { Metadata } from "next";
import { SchoolsPage } from "@/components/schools/schools-page";
import { schoolsPath } from "@/lib/i18n";

export const metadata: Metadata = {
  ...publicSocialMetadata("pl", { title: "CVUnfold dla szkół IT i bootcampów", description: "Analiza CV całej grupy, konkretne uwagi dla kursantów i wspólne obszary do pracy na zajęciach. Poznaj panel CVUnfold i porozmawiajmy o współpracy.", path: "/dla-szkol" }),

  robots: { index: true, follow: true, noimageindex: false },
  "title": "CVUnfold dla szkół IT i bootcampów",
  "description": "Analiza CV całej grupy, konkretne uwagi dla kursantów i wspólne obszary do pracy na zajęciach. Poznaj panel CVUnfold i porozmawiajmy o współpracy.",
  "alternates": {
    "canonical": schoolsPath("pl"),
    "languages": {
      "pl-PL": schoolsPath("pl"),
      "en": schoolsPath("en"),
      "x-default": schoolsPath("pl")
    }
  }
};

export default function Page() { return <SchoolsPage locale="pl"/>; }
