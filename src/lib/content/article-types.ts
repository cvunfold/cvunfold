export type ArticleBlock =
  | { type: "paragraph" | "heading"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean };

export type ArticleLink = { label: string; href: string };

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  blocks?: ArticleBlock[];
  links?: ArticleLink[];
  paragraphsAfterExample?: string[];
  example?: {
    before: string;
    after: string;
    note: string;
    beforeLabel?: string;
    afterLabel?: string;
  };
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  readingTime: string;
  publishedAt?: string;
  updatedAt?: string;
  publicationStatus?: "draft";
  intro: string;
  openingParagraphs?: string[];
  cover?: { src: string; alt: string; width: number; height: number };
  sections: ArticleSection[];
  checklist: string[];
};

export function isPublishedArticle(article: Article): article is Article & { publishedAt: string } {
  return article.publicationStatus !== "draft" && Boolean(article.publishedAt);
}

export function isArticleAvailable(article: Article): boolean {
  return isPublishedArticle(article) || process.env.NODE_ENV !== "production";
}
