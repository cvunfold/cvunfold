import type { Metadata } from "next";
import { ArticlesIndexPage } from "@/components/articles-index-page";
import { articlesEn } from "@/lib/content/articles-en";
export const metadata: Metadata = { title: "Developer CV, seniority and ownership guides", description: "Practical guides to seniority, ownership, impact, technical credibility and a safer career in the age of AI.", alternates: { canonical: "/en/articles", languages: { "pl-PL": "/artykuly", en: "/en/articles" } } };
export default function Page(){ return <ArticlesIndexPage locale="en" articles={articlesEn}/>; }
