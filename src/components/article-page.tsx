import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/content/articles";
import type { Locale } from "@/lib/i18n";
import { analysisPath, articlesPath, homePath, methodologyPath, sampleReportPath } from "@/lib/i18n";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { JsonLd } from "@/components/json-ld";
import { buildArticleStructuredData } from "@/lib/seo";

export function ArticlePageView({ locale, article, related }: { locale: Locale; article: Article; related: Article[] }) {
  const en = locale === "en";
  const publishedLabel = new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", { dateStyle: "long", timeZone: "Europe/Warsaw" }).format(new Date(`${article.publishedAt}T09:00:00+02:00`));
  return <main className="article-page"><JsonLd data={buildArticleStructuredData(article, locale)}/>
    <header className="site-header container"><Logo locale={locale}/><nav aria-label={en ? "Main navigation" : "Główna nawigacja"}><Link href={articlesPath(locale)}>{en ? "All articles" : "Wszystkie artykuły"}</Link><Link href={sampleReportPath(locale)}>{en ? "Sample report" : "Przykładowy raport"}</Link></nav><Link className="button small" href={analysisPath(locale)}>{en ? "Review my CV" : "Sprawdź CV"}<ArrowIcon/></Link></header>
    <article><header className="article-hero container"><nav className="article-breadcrumb" aria-label={en ? "Breadcrumb" : "Okruszki"}><Link href={homePath(locale)}>{en ? "Home" : "Strona główna"}</Link><span>/</span><Link href={articlesPath(locale)}>{en ? "Articles" : "Artykuły"}</Link><span>/</span><span>{article.category}</span></nav><div className="article-hero-grid"><div><span className="article-category">{article.category}</span><h1>{article.title}</h1></div><div className="article-lead"><p>{article.intro}</p><div className="article-meta"><span>{article.readingTime} {en ? "read" : "czytania"}</span><time dateTime={article.publishedAt}>{en ? "Published" : "Opublikowano"} {publishedLabel}</time></div></div></div></header>
      <div className="article-body container"><aside aria-label={en ? "In this article" : "W tym artykule"}><span>{en ? "In this article" : "W tym artykule"}</span><ol>{article.sections.map((section,index)=><li key={section.heading}><a href={`#section-${index+1}`}>{section.heading}</a></li>)}</ol><div className="article-author-mini"><Image src="/images/pawel-maczka-czarnecki.png" width={56} height={56} alt=""/><p>{en ? "Written and reviewed by" : "Autor i weryfikacja"}<Link href={methodologyPath(locale)}>Paweł Mączka-Czarnecki</Link></p></div></aside><div className="article-prose">{article.sections.map((section,index)=><section id={`section-${index+1}`} key={section.heading}><span className="article-section-number">{String(index+1).padStart(2,"0")}</span><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.example?<div className="article-example"><div><span>{en ? "Too generic" : "Zbyt ogólnie"}</span><p>{section.example.before}</p></div><div><span>{en ? "More evidence" : "Więcej dowodu"}</span><p>{section.example.after}</p></div><small>{section.example.note}</small></div>:null}</section>)}<section className="article-checklist"><div className="article-checklist-heading"><span className="article-section-number">✓</span><h2>{en ? "Check your CV" : "Sprawdź swoje CV"}</h2></div><ul>{article.checklist.map(item=><li key={item}><CheckIcon/>{item}</li>)}</ul></section></div></div>
    </article>
    <section className="related-articles"><div className="container"><h2>{en ? "Read next" : "Czytaj dalej"}</h2><div>{related.map(item=><article key={item.slug}><span>{item.category}</span><h3><Link href={`${articlesPath(locale)}/${item.slug}`}>{item.title}</Link></h3><Link className="text-link" href={`${articlesPath(locale)}/${item.slug}`}>{en ? "Read" : "Czytaj"}<ArrowIcon/></Link></article>)}</div></div></section>
    <section className="knowledge-cta"><div className="container"><div><h2>{en ? "See these signals in your CV" : "Zobacz te sygnały w swoim CV"}</h2><p>{en ? "Get an evidence-based review without invented experience." : "Otrzymaj ocenę opartą na dowodach — bez dopisywania doświadczenia."}</p></div><Link className="button" href={analysisPath(locale)}>{en ? "Analyse my CV" : "Analizuj CV"}<ArrowIcon/></Link></div></section>
  </main>;
}
