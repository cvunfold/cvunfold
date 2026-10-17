import type { Metadata } from "next";
import { ArticlesIndexPage } from "@/components/articles-index-page";
import { articles } from "@/lib/content/articles";
const title = "Jak napisać i poprawić CV programisty: poradniki";
const description = "Poradniki o pierwszym CV w IT, czytelności ATS, opisach projektów i doświadczenia. Konkretne przykłady oraz zasady poprawiania CV programisty.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/artykuly", languages: { "pl-PL": "/artykuly", en: "/en/articles", "x-default": "/artykuly" } },
  openGraph: { title, description, url: "/artykuly", locale: "pl_PL", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export default function Page() { return <ArticlesIndexPage locale="pl" articles={articles}/>; }
