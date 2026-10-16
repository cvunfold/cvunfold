import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/content/articles";
import type { Locale } from "@/lib/i18n";
import { analysisPath, articlesPath, homePath, methodologyPath } from "@/lib/i18n";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { PublicHeader } from "@/components/public-header";
import { buildArticleStructuredData } from "@/lib/seo";
import { translatedArticlePath } from "@/lib/article-translations";
import { ArticleTableOfContents } from "@/components/article-table-of-contents";
import { ArticleSectionContent } from "@/components/article-section-content";

export function ArticlePageView({ locale, article, related }: { locale: Locale; article: Article; related: Article[] }) {
  const en = locale === "en";
  const formatDate = (value: string) => new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", { dateStyle: "long", timeZone: "Europe/Warsaw" }).format(new Date(`${value}T09:00:00+02:00`));
  const publishedLabel = article.publishedAt ? formatDate(article.publishedAt) : null;
  // A refreshed article has to show the refresh; dateModified alone is invisible to the reader.
  const updatedLabel = article.updatedAt && article.updatedAt !== article.publishedAt ? formatDate(article.updatedAt) : null;
  const hasExamples = article.sections.some(section => section.example);
  return <main className="article-page"><JsonLd data={buildArticleStructuredData(article, locale)}/>
    <PublicHeader locale={locale} languageHref={translatedArticlePath(article.slug, locale)}/>
    <article><header className="article-hero container"><nav className="article-breadcrumb" aria-label={en ? "Breadcrumb" : "Okruszki"}><Link href={homePath(locale)}>{en ? "Home" : "Strona główna"}</Link><span>/</span><Link href={articlesPath(locale)}>{en ? "Articles" : "Artykuły"}</Link><span>/</span><span>{article.category}</span></nav><div className={`article-hero-grid${article.cover ? " article-hero-illustrated" : ""}`}>{article.cover ? <Image className="article-hero-background" src={article.cover.src} alt="" fill sizes="(max-width: 1230px) calc(100vw - 48px), 1180px" priority/> : null}<div><span className="article-category">{article.category}</span><h1>{article.title}</h1></div><div className="article-lead"><p>{article.intro}</p><div className="article-meta"><span>{article.readingTime} {en ? "read" : "czytania"}</span>{publishedLabel ? <time dateTime={article.publishedAt}>{en ? "Published" : "Opublikowano"} {publishedLabel}</time> : <span className="article-draft-label">{en ? "Local draft" : "Lokalny draft"}</span>}{updatedLabel ? <time dateTime={article.updatedAt}>{en ? "Updated" : "Zaktualizowano"} {updatedLabel}</time> : null}</div></div></div></header>
      <div className="article-body container"><aside aria-label={en ? "In this article" : "W tym artykule"}><span>{en ? "In this article" : "W tym artykule"}</span><ArticleTableOfContents headings={article.sections.map(section => section.heading)}/><div className="article-author-mini"><Image src="/images/optimized/pawel-maczka-czarnecki-138b56a27c41.webp" width={56} height={56} alt=""/><p>{en ? "Written by" : "Autor"}<Link href={methodologyPath(locale)}>Paweł Mączka-Czarnecki</Link></p></div></aside><div className="article-prose">{hasExamples ? <p className="article-example-note">{en ? "Before-and-after examples are illustrations. Use a revised description only when the facts match your work." : "Przykłady przed i po są ilustracyjne. Użyj poprawionego opisu tylko wtedy, gdy zgadza się z Twoją pracą."}</p> : null}{article.openingParagraphs?.length ? <div className="article-opening">{article.openingParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div> : null}{article.sections.map((section,index)=><section id={`section-${index+1}`} key={section.heading}><span className="article-section-number">{String(index+1).padStart(2,"0")}</span><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<ArticleSectionContent section={section} locale={locale}/>{section.example?<div className="article-example"><div><span>{section.example.beforeLabel ?? (en ? "Too generic" : "Zbyt ogólnie")}</span><p>{section.example.before}</p></div><div><span>{section.example.afterLabel ?? (en ? "More evidence" : "Więcej dowodu")}</span><p>{section.example.after}</p></div><small>{section.example.note}</small></div>:null}{section.paragraphsAfterExample?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}{article.checklist.length ? <section className="article-checklist"><div className="article-checklist-heading"><span className="article-section-number">✓</span><h2>{en ? "Check your CV" : "Sprawdź swoje CV"}</h2></div><ul>{article.checklist.map(item=><li key={item}><CheckIcon/>{item}</li>)}</ul></section> : null}</div></div>
    </article>
    <section className="related-articles"><div className="container"><h2>{en ? "Read next" : "Czytaj dalej"}</h2><div>{related.map(item=><article key={item.slug}><span>{item.category}</span><h3><Link href={`${articlesPath(locale)}/${item.slug}`}>{item.title}</Link></h3><Link className="text-link" href={`${articlesPath(locale)}/${item.slug}`}>{en ? "Read" : "Czytaj"}<ArrowIcon/></Link></article>)}</div></div></section>
    <section className="knowledge-cta"><div className="container"><div><h2>{en ? "See these signals in your CV" : "Zobacz te sygnały w swoim CV"}</h2><p>{en ? "Get an evidence-based review without invented experience." : "Otrzymaj ocenę opartą na dowodach, bez dopisywania doświadczenia."}</p></div><Link className="button" href={analysisPath(locale)}>{en ? "Analyse my CV" : "Analizuj CV"}<ArrowIcon/></Link></div></section>
  </main>;
}
