import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SiteTopbar } from "@/components/site-topbar";
import { analysisPath, schoolsPath, articlesPath, homePath, type Locale } from "@/lib/i18n";

const navigation = {
  pl: {
    labels: ["Różnica", "Raport", "Cennik", "FAQ"],
    ids: ["roznica", "raport", "cennik", "faq"],
    articles: "Artykuły",
    schools: "Dla szkół",
    cta: "Sprawdź CV",
    switch: "EN",
    aria: "Główna nawigacja",
  },
  en: {
    labels: ["Difference", "Report", "Pricing", "FAQ"],
    ids: ["difference", "report", "pricing", "faq"],
    articles: "Articles",
    schools: "For schools",
    cta: "Review my CV",
    switch: "PL",
    aria: "Main navigation",
  },
} as const;

type Props = {
  locale: Locale;
  languageHref: string;
  homePage?: boolean;
};

export function PublicHeader({ locale, languageHref, homePage = false }: Props) {
  const t = navigation[locale];
  const home = homePath(locale);

  return <SiteTopbar className="site-header public-header">
    <Logo locale={locale}/>
    <nav aria-label={t.aria}>
      {t.labels.map((label, index) => <Link key={label} href={homePage ? `#${t.ids[index]}` : `${home}#${t.ids[index]}`}>{label}</Link>)}
      <Link className="articles-nav-link" href={articlesPath(locale)} prefetch={false}>{t.articles}</Link>
      <Link className="school-nav-link" href={schoolsPath(locale)} hrefLang={locale} prefetch={false}>{t.schools} <span aria-hidden="true">↗</span></Link>
    </nav>
    <Link className="language-switch" href={languageHref} hrefLang={locale === "pl" ? "en" : "pl"} prefetch={false}>{t.switch}</Link>
    <Link className="button button-primary small" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="header">{t.cta}<ArrowIcon/></Link>
  </SiteTopbar>;
}
