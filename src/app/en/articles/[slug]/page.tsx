import { notFound } from "next/navigation";
import { ArticlePageView } from "@/components/article-page";
import { articlesEn, articlesEnBySlug } from "@/lib/content/articles-en";
import { articleMetadata } from "@/lib/content/article-metadata";
import { isArticleAvailable } from "@/lib/content/article-types";
import { relatedArticles } from "@/lib/content/article-navigation";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return articlesEn.filter(isArticleAvailable).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const article = articlesEnBySlug.get((await params).slug);
  return article && isArticleAvailable(article) ? articleMetadata(article, "en") : {};
}
export default async function Page({ params }: Props) {
  const article = articlesEnBySlug.get((await params).slug);
  if (!article || !isArticleAvailable(article)) notFound();
  return <ArticlePageView locale="en" article={article} related={relatedArticles(articlesEn, article, "en")}/>;
}
