import Link from "next/link";
import type { Article } from "@/lib/content/articles";
import type { Locale } from "@/lib/i18n";
import { analysisPath, articlesPath, homePath } from "@/lib/i18n";
import { ArrowIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { PublicHeader } from "@/components/public-header";
import { brand } from "@/lib/brand";
import { articleGroups } from "@/lib/content/article-navigation";

export function ArticlesIndexPage({ locale, articles }: { locale: Locale; articles: Article[] }) {
  const en = locale === "en";
  const groups = articleGroups(articles, locale);
  return <main className="knowledge-page">
    <PublicHeader locale={locale} languageHref={en ? "/artykuly" : "/en/articles"}/>
    <section className="knowledge-hero container"><div><nav className="knowledge-breadcrumb" aria-label={en ? "Breadcrumb" : "Okruszki"}><Link href={homePath(locale)}>{en ? "Home" : "Strona główna"}</Link><span>/</span><span>{en ? "Articles" : "Artykuły"}</span></nav><h1>{en ? "How to write and improve a developer CV" : "Jak napisać i poprawić CV programisty"}</h1></div><p>{en ? "Start with your first tech CV, ATS readability or a worked frontend example. Then improve how you describe skills, responsibility and outcomes." : "Pierwsze CV w IT, czytelność ATS i przykład CV frontend developera. Wybierz problem, który chcesz rozwiązać, i przejdź do konkretnego poradnika."}</p></section>
    <nav className="article-topic-nav container" aria-label={en ? "Choose a CV topic" : "Wybierz temat CV"}>{groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.title}</a>)}</nav>
    <div className="article-index container">{groups.map(group => <section className="article-topic-group" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
      <h2 id={`${group.id}-title`}>{group.title}</h2>
      {group.articles.map((article, index) => <article className="article-row" key={article.slug}>
        <span className="article-index-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="article-row-copy"><span className="article-category">{article.category}{article.publicationStatus === "draft" ? (en ? " · Local draft" : " · Lokalny draft") : ""}</span><h3><Link href={`${articlesPath(locale)}/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p></div>
        <div className="article-row-action"><span>{article.readingTime} {en ? "read" : "czytania"}</span><Link aria-label={`${en ? "Read" : "Czytaj"}: ${article.title}`} href={`${articlesPath(locale)}/${article.slug}`}><ArrowIcon/></Link></div>
      </article>)}
    </section>)}</div>
    <section className="knowledge-cta"><div className="container"><div><h2>{en ? "What does your CV really communicate?" : "Co naprawdę pokazuje Twoje CV?"}</h2><p>{en ? "The guides explain the signals. The review shows which ones are visible in your document." : "Artykuły wyjaśniają sygnały. Analiza pokaże, które widać w Twoim dokumencie."}</p></div><Link className="button" href={analysisPath(locale)}>{en ? "Review my CV" : "Sprawdź swoje CV"}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer container"><Logo locale={locale}/><p>{en ? "Evidence-based CV review for developers." : "Merytoryczna analiza CV dla developerów."}</p><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
  </main>;
}
