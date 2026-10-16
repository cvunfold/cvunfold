import { notFound } from "next/navigation";
import { ArticlePageView } from "@/components/article-page";
import { articles, articlesBySlug } from "@/lib/content/articles";
import { articleMetadata } from "@/lib/content/article-metadata";
import { isArticleAvailable } from "@/lib/content/article-types";
import { relatedArticles } from "@/lib/content/article-navigation";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return articles.filter(isArticleAvailable).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const article = articlesBySlug.get((await params).slug);
  return article && isArticleAvailable(article) ? articleMetadata(article, "pl") : {};
}
export default async function Page({ params }: Props) {
  const article = articlesBySlug.get((await params).slug);
  if (!article || !isArticleAvailable(article)) notFound();
  return <ArticlePageView locale="pl" article={article} related={relatedArticles(articles, article, "pl")}/>;
}
