import type { Metadata } from "next";
import { ArticlesIndexPage } from "@/components/articles-index-page";
import { articlesEn } from "@/lib/content/articles-en";
const title = "How to write and improve a developer CV: guides";
const description = "Practical guides to your first tech CV, ATS readability, project descriptions and professional experience. Worked examples and clear editing advice.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/en/articles", languages: { "pl-PL": "/artykuly", en: "/en/articles", "x-default": "/artykuly" } },
  openGraph: { title, description, url: "/en/articles", locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export default function Page() { return <ArticlesIndexPage locale="en" articles={articlesEn}/>; }
