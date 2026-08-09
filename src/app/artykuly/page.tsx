import type { Metadata } from "next";
import { ArticlesIndexPage } from "@/components/articles-index-page";
import { articles } from "@/lib/content/articles";
export const metadata: Metadata = { title: "Artykuły o CV developera, seniority i ownershipie", description: "Praktyczne artykuły o seniority, ownershipie, wpływie, technicznej wiarygodności i karierze w świecie AI.", alternates: { canonical: "/artykuly", languages: { "pl-PL": "/artykuly", en: "/en/articles" } } };
export default function Page(){ return <ArticlesIndexPage locale="pl" articles={articles}/>; }
