import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Logo } from "@/components/logo";
import { articles, articlesBySlug } from "@/lib/content/articles";
import { SITE_LOCALE, SITE_NAME, articleImageUrl, buildArticleStructuredData } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articlesBySlug.get(slug);
  if (!article) return {};

  const url = `/pl/artykuly/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    authors: [{ name: SITE_NAME, url: "/pl/artykuly" }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: article.category,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      title: `${article.title} · CVUnfold`,
      description: article.description,
      url,
      type: "article",
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      publishedTime: `${article.publishedAt}T09:00:00+02:00`,
      modifiedTime: `${article.publishedAt}T09:00:00+02:00`,
      authors: [SITE_NAME],
      section: article.category,
      images: [{ url: articleImageUrl(article), width: 1200, height: 630, alt: article.title }],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.description, images: [{ url: articleImageUrl(article), alt: article.title }] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articlesBySlug.get(slug);
  if (!article) notFound();

  const related = articles.filter(({ slug: candidate }) => candidate !== slug).slice(0, 3);
  const structuredData = buildArticleStructuredData(article);
  const publishedLabel = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeZone: "Europe/Warsaw" })
    .format(new Date(`${article.publishedAt}T09:00:00+02:00`));

  return <main className="article-page">
    <JsonLd data={structuredData} />
    <header className="site-header container">
      <Logo />
      <nav aria-label="Główna nawigacja">
        <Link href="/pl/artykuly">Wszystkie artykuły</Link>
        <Link href="/pl/przykladowy-raport">Przykładowy raport</Link>
      </nav>
      <Link className="button small" href="/pl/analiza">Sprawdź CV <ArrowIcon /></Link>
    </header>

    <article>
      <header className="article-hero container">
        <nav className="article-breadcrumb" aria-label="Okruszki">
          <Link href="/pl">Strona główna</Link><span aria-hidden="true">/</span>
          <Link href="/pl/artykuly">Artykuły</Link><span aria-hidden="true">/</span>
          <span>{article.category}</span>
        </nav>
        <div className="article-hero-grid">
          <div>
            <span className="article-category">{article.category}</span>
            <h1>{article.title}</h1>
          </div>
          <div className="article-lead">
            <p>{article.intro}</p>
            <div className="article-meta"><span>{article.readingTime} czytania · CVUnfold</span><time dateTime={article.publishedAt}>Opublikowano {publishedLabel}</time></div>
          </div>
        </div>
      </header>

      <div className="article-body container">
        <aside aria-label="W tym artykule">
          <span>W tym artykule</span>
          <ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#sekcja-${index + 1}`}>{section.heading}</a></li>)}</ol>
        </aside>
        <div className="article-prose">
          {article.sections.map((section, index) => <section id={`sekcja-${index + 1}`} key={section.heading}>
            <span className="article-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.example ? <div className="article-example">
              <div><span>Zbyt ogólnie</span><p>{section.example.before}</p></div>
              <div><span>Więcej dowodu</span><p>{section.example.after}</p></div>
              <small>{section.example.note}</small>
            </div> : null}
          </section>)}

          <section className="article-checklist">
            <span className="article-section-number" aria-hidden="true">✓</span>
            <h2>Sprawdź swoje CV</h2>
            <ul>{article.checklist.map((item) => <li key={item}><CheckIcon />{item}</li>)}</ul>
          </section>
        </div>
      </div>
    </article>

    <section className="related-articles">
      <div className="container">
        <h2>Czytaj dalej</h2>
        <div>{related.map((item) => <article key={item.slug}>
          <span>{item.category}</span>
          <h3><Link href={`/pl/artykuly/${item.slug}`}>{item.title}</Link></h3>
          <Link className="text-link" href={`/pl/artykuly/${item.slug}`}>Czytaj <ArrowIcon /></Link>
        </article>)}</div>
      </div>
    </section>

    <section className="knowledge-cta">
      <div className="container">
        <div><h2>Zobacz te sygnały w swoim CV</h2><p>Otrzymaj ocenę opartą na dowodach z dokumentu — bez dopisywania doświadczenia.</p></div>
        <Link className="button" href="/pl/analiza">Analizuj CV <ArrowIcon /></Link>
      </div>
    </section>

    <footer className="footer-shell">
      <div className="footer container"><Logo /><p>Merytoryczna analiza CV wspierana przez AI.</p><span>© {new Date().getFullYear()} CVUnfold</span></div>
    </footer>
  </main>;
}
