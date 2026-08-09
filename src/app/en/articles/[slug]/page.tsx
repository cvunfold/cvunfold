import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePageView } from "@/components/article-page";
import { articlesEn, articlesEnBySlug } from "@/lib/content/articles-en";
import { brand } from "@/lib/brand";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return articlesEn.map(({slug})=>({slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const article=articlesEnBySlug.get((await params).slug);if(!article)return{};return{title:article.title,description:article.description,authors:[{name:brand.name}],alternates:{canonical:`/en/articles/${article.slug}`},openGraph:{type:"article",title:article.title,description:article.description,url:`/en/articles/${article.slug}`,locale:"en_US"}};}
export default async function Page({params}:Props){const {slug}=await params;const article=articlesEnBySlug.get(slug);if(!article)notFound();return <ArticlePageView locale="en" article={article} related={articlesEn.filter(item=>item.slug!==slug).slice(0,3)}/>;}
