import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Logo } from "@/components/logo";
import { articles } from "@/lib/content/articles";
import { SITE_LANGUAGE, SITE_LOCALE, SITE_NAME, WEBSITE_ID, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Artykuły o CV i karierze w branży tech",
  description: "Praktyczne artykuły o karierze w świecie AI, ownershipie, seniority, wpływie, wiarygodności technicznej i pierwszym wrażeniu, jakie robi CV.",
  authors: [{ name: SITE_NAME, url: "/pl/artykuly" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/pl/artykuly", types: { "application/rss+xml": "/pl/artykuly/feed.xml" } },
  openGraph: {
    title: "Artykuły o CV i karierze w branży tech · CVUnfold",
    description: "Jak budować odporniejszą karierę w świecie AI i pokazać w CV ownership, seniority, wpływ oraz techniczną wiarygodność.",
    url: "/pl/artykuly",
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wiedza CVUnfold — CV i kariera w branży tech" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artykuły o CV i karierze w branży tech · CVUnfold",
    description: "Jak budować odporniejszą karierę i pokazywać w CV ownership, seniority, wpływ oraz techniczną wiarygodność.",
    images: [{ url: "/opengraph-image", alt: "Wiedza CVUnfold — CV i kariera w branży tech" }],
  },
};

const articlesUrl = absoluteUrl("/pl/artykuly");
const articlesStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${articlesUrl}#webpage`,
      url: articlesUrl,
      name: "Artykuły o CV i karierze w branży tech",
      description: metadata.description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${articlesUrl}#breadcrumb` },
      mainEntity: { "@id": `${articlesUrl}#articles` },
      inLanguage: SITE_LANGUAGE,
    },
    {
      "@type": "ItemList",
      "@id": `${articlesUrl}#articles`,
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: article.title,
        url: absoluteUrl(`/pl/artykuly/${article.slug}`),
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${articlesUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Strona główna", item: absoluteUrl("/pl") },
        { "@type": "ListItem", position: 2, name: "Artykuły", item: articlesUrl },
      ],
    },
  ],
};

export default function ArticlesPage() {
  return <main className="knowledge-page">
    <JsonLd data={articlesStructuredData} />
    <header className="site-header container">
      <Logo />
      <nav aria-label="Główna nawigacja">
        <Link href="/pl">Strona główna</Link>
        <Link href="/pl/przykladowy-raport">Przykładowy raport</Link>
      </nav>
      <Link className="button small" href="/pl/analiza">Sprawdź CV <ArrowIcon /></Link>
    </header>

    <section className="knowledge-hero container">
      <div><nav className="knowledge-breadcrumb" aria-label="Okruszki"><Link href="/pl">Strona główna</Link><span aria-hidden="true">/</span><span>Artykuły</span></nav><h1>Lepsza kariera zaczyna się od realnej wartości</h1></div>
      <p>Konkretnie o tym, jak rozwijać i pokazywać doświadczenie, odpowiedzialność oraz wpływ — także w świecie coraz mocniej zmienianym przez AI.</p>
    </section>

    <section className="article-index container" aria-label="Lista artykułów">
      {articles.map((article, index) => <article className="article-row" key={article.slug}>
        <span className="article-index-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="article-row-copy">
          <span className="article-category">{article.category}</span>
          <h2><Link href={`/pl/artykuly/${article.slug}`}>{article.title}</Link></h2>
          <p>{article.excerpt}</p>
        </div>
        <div className="article-row-action">
          <span>{article.readingTime} czytania</span>
          <Link aria-label={`Czytaj: ${article.title}`} href={`/pl/artykuly/${article.slug}`}><ArrowIcon /></Link>
        </div>
      </article>)}
    </section>

    <section className="knowledge-cta">
      <div className="container">
        <div>
          <h2>Co naprawdę pokazuje Twoje CV?</h2>
          <p>Artykuły podpowiadają, czego szukać. Analiza wskaże, które sygnały są widoczne w Twoim dokumencie.</p>
        </div>
        <Link className="button" href="/pl/analiza">Sprawdź swoje CV <ArrowIcon /></Link>
      </div>
    </section>

    <footer className="footer-shell">
      <div className="footer container"><Logo /><p>Merytoryczna analiza CV wspierana przez AI.</p><span>© {new Date().getFullYear()} CVUnfold</span></div>
    </footer>
  </main>;
}
