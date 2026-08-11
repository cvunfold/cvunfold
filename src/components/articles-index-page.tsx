import Link from "next/link";
import type { Article } from "@/lib/content/articles";
import type { Locale } from "@/lib/i18n";
import { analysisPath, articlesPath, homePath } from "@/lib/i18n";
import { ArrowIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { PublicHeader } from "@/components/public-header";
import { brand } from "@/lib/brand";

export function ArticlesIndexPage({ locale, articles }: { locale: Locale; articles: Article[] }) {
  const en = locale === "en";
  return <main className="knowledge-page">
    <PublicHeader locale={locale} languageHref={en ? "/artykuly" : "/en/articles"}/>
    <section className="knowledge-hero container"><div><nav className="knowledge-breadcrumb" aria-label={en ? "Breadcrumb" : "Okruszki"}><Link href={homePath(locale)}>{en ? "Home" : "Strona główna"}</Link><span>/</span><span>{en ? "Articles" : "Artykuły"}</span></nav><h1>{en ? "Build value before you rewrite the CV" : "Lepsza kariera zaczyna się od realnej wartości"}</h1></div><p>{en ? "Practical guides to ownership, seniority, impact and technical credibility — written for people, not search engines." : "Konkretnie o tym, jak rozwijać i pokazywać doświadczenie, odpowiedzialność oraz wpływ — także w świecie zmienianym przez AI."}</p></section>
    <section className="article-index container" aria-label={en ? "Article list" : "Lista artykułów"}>{articles.map((article, index) => <article className="article-row" key={article.slug}><span className="article-index-number">{String(index + 1).padStart(2,"0")}</span><div className="article-row-copy"><span className="article-category">{article.category}</span><h2><Link href={`${articlesPath(locale)}/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p></div><div className="article-row-action"><span>{article.readingTime} {en ? "read" : "czytania"}</span><Link aria-label={`${en ? "Read" : "Czytaj"}: ${article.title}`} href={`${articlesPath(locale)}/${article.slug}`}><ArrowIcon/></Link></div></article>)}</section>
    <section className="knowledge-cta"><div className="container"><div><h2>{en ? "What does your CV really communicate?" : "Co naprawdę pokazuje Twoje CV?"}</h2><p>{en ? "The guides explain the signals. The review shows which ones are visible in your document." : "Artykuły wyjaśniają sygnały. Analiza pokaże, które widać w Twoim dokumencie."}</p></div><Link className="button" href={analysisPath(locale)}>{en ? "Review my CV" : "Sprawdź swoje CV"}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer container"><Logo locale={locale}/><p>{en ? "Evidence-based CV review for developers." : "Merytoryczna analiza CV dla developerów."}</p><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
  </main>;
}
