import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePageView } from "@/components/article-page";
import { articleAlternates } from "@/lib/article-translations";
import { articles, articlesBySlug } from "@/lib/content/articles";
import { brand } from "@/lib/brand";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return articles.map(({slug})=>({slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const article=articlesBySlug.get((await params).slug);if(!article)return{};return{title:article.title,description:article.description,authors:[{name:"Paweł Mączka-Czarnecki",url:"/o-metodologii"}],creator:"Paweł Mączka-Czarnecki",publisher:brand.name,alternates:{canonical:`/artykuly/${article.slug}`,languages:articleAlternates(article.slug,"pl")},openGraph:{type:"article",title:article.title,description:article.description,url:`/artykuly/${article.slug}`,locale:"pl_PL",authors:["Paweł Mączka-Czarnecki"]}};}
export default async function Page({params}:Props){const {slug}=await params;const article=articlesBySlug.get(slug);if(!article)notFound();return <ArticlePageView locale="pl" article={article} related={articles.filter(item=>item.slug!==slug).slice(0,3)}/>;}
