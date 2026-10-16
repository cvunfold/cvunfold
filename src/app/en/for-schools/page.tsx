import { publicSocialMetadata } from "@/lib/public-page-metadata";
import type { Metadata } from "next";
import { SchoolsPage } from "@/components/schools/schools-page";
import { schoolsPath } from "@/lib/i18n";

export const metadata: Metadata = {
  ...publicSocialMetadata("en", { title: "CVUnfold for IT schools and bootcamps", description: "Review your students’ CVs, find common areas for improvement and plan practical workshops. Explore CVUnfold for IT schools and bootcamps.", path: "/en/for-schools" }),

  "title": "CVUnfold for IT schools and bootcamps",
  "description": "Review your students’ CVs, find common areas for improvement and plan practical workshops. Explore CVUnfold for IT schools and bootcamps.",
  "alternates": {
    "canonical": schoolsPath("en"),
    "languages": {
      "pl-PL": schoolsPath("pl"),
      "en": schoolsPath("en"),
      "x-default": schoolsPath("pl")
    }
  }
};

export default function Page() { return <SchoolsPage locale="en"/>; }
