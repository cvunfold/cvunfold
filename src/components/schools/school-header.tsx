import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteTopbar } from "@/components/site-topbar";
import { homePath, schoolsPath, type Locale } from "@/lib/i18n";
import { SchoolBrand } from "./school-brand";
import { schoolSiteOrigin } from "@/lib/schools/urls";
import { absoluteUrl } from "@/lib/seo";

export function SchoolHeader({ locale = "pl", demo = false, panelActive = false, busy = false, onLogout }: {
  locale?: Locale; demo?: boolean; panelActive?: boolean; busy?: boolean; onLogout?: () => void;
}) {
  return <SiteTopbar className="site-header school-header school-site-header">
    <div className="school-header-identity"><SchoolBrand locale={locale}/>{demo ? <span className="school-badge">Demo · fikcyjne dane</span> : null}</div>
    <nav aria-label={locale === "pl" ? "Główna nawigacja dla szkół" : "Main navigation for schools"}>
      <Link href={`${schoolsPath(locale)}#oferta`} prefetch={false}>{locale === "pl" ? "Oferta" : "How it works"}</Link>
      <Link href="/dla-szkol/demo" prefetch={false} aria-current={demo ? "page" : undefined} data-analytics-event="school_demo_clicked" data-analytics-placement="header">Demo</Link>
      <Link className="school-main-site-link" href={schoolSiteOrigin() ? absoluteUrl(homePath(locale)) : homePath(locale)} prefetch={false}>{locale === "pl" ? "Przejdź do CVUnfold" : "Go to CVUnfold"} <span aria-hidden="true">↗</span></Link>
      {onLogout ? <button className="school-header-logout" type="button" disabled={busy} onClick={onLogout}>Wyloguj się</button> : null}
    </nav>
    <Link className="language-switch" href={schoolsPath(locale === "pl" ? "en" : "pl")} hrefLang={locale === "pl" ? "en" : "pl"}>{locale === "pl" ? "EN" : "PL"}</Link>
    <Link className="button button-primary small" href="/dla-szkol/panel" aria-current={panelActive ? "page" : undefined}>{locale === "pl" ? "Panel szkoły" : "School panel"}<ArrowRight size={18} aria-hidden="true"/></Link>
  </SiteTopbar>;
}
