import Link from "next/link";
import { Logo } from "@/components/logo";
import { brand } from "@/lib/brand";
import { homePath, legalPath, type Locale } from "@/lib/i18n";

export type LegalPageKind = "terms" | "privacy" | "cookies" | "delete" | "contact";

const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME?.trim();
const companyId = process.env.NEXT_PUBLIC_COMPANY_ID?.trim();
const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS?.trim();

const content = {
  pl: {
    labels: { terms: "Regulamin", privacy: "Polityka prywatności", cookies: "Polityka cookies", delete: "Usunięcie danych", contact: "Kontakt" },
    back: "Strona główna", reviewed: "Obowiązuje od: 11 sierpnia 2026", draft: "Dokument opisuje zasady świadczenia usługi CV Unfold w aktualnej wersji produktu.",
    missing: "Dane identyfikacyjne usługodawcy nie zostały jeszcze skonfigurowane. Sprzedaż produkcyjna pozostaje zablokowana do ich uzupełnienia.",
  },
  en: {
    labels: { terms: "Terms", privacy: "Privacy policy", cookies: "Cookie policy", delete: "Delete data", contact: "Contact" },
    back: "Home", reviewed: "Effective from: 11 August 2026", draft: "This document describes the CV Unfold service in its current product version.",
    missing: "The service provider's identification details have not been configured. Live sales remain blocked until they are supplied.",
  },
} as const;

function ProviderDetails({ locale, includeEmail = true }: { locale: Locale; includeEmail?: boolean }) {
  const t = content[locale];
  if (!companyName || !companyId || !companyAddress || !brand.supportEmail) return <p className="legal-warning">{t.missing}</p>;
  return <address><strong>{companyName}</strong><span>{companyAddress}</span><span>{companyId}</span>{includeEmail ? <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> : null}</address>;
}

function Sections({ locale, kind }: { locale: Locale; kind: LegalPageKind }) {
  const en = locale === "en";
  if (kind === "privacy") return <>
    <section><h2>{en ? "What we process" : "Jakie dane przetwarzamy"}</h2><p>{en ? "We process the CV file, selected target role and optional job description solely to produce the requested analysis. Contact details are masked before the main model review where possible. We do not use CV content for advertising or analytics." : "Przetwarzamy plik CV, wybraną rolę docelową i opcjonalną treść ogłoszenia wyłącznie w celu przygotowania zamówionej analizy. Dane kontaktowe maskujemy przed właściwą analizą modelu tam, gdzie jest to możliwe. Nie wykorzystujemy treści CV do reklam ani analytics."}</p></section>
    <section><h2>{en ? "Storage and retention" : "Przechowywanie i retencja"}</h2><p>{en ? "The source document is processed in server memory and is not saved in product storage. The generated report, raw voluntary feedback and minimal operational metadata are stored in a private database for up to 30 days, unless you delete them earlier. Controlled failures do not intentionally retain the source file." : "Dokument źródłowy jest przetwarzany w pamięci serwera i nie jest zapisywany w storage produktu. Wygenerowany raport, surowy dobrowolny feedback oraz minimalne metadane operacyjne są przechowywane w prywatnej bazie maksymalnie przez 30 dni, chyba że usuniesz je wcześniej. Kontrolowane błędy nie powodują celowego zachowania pliku źródłowego."}</p></section>
    <section><h2>{en ? "Product-quality statistics" : "Statystyki jakości produktu"}</h2><p>{en ? "When you voluntarily rate a report, we retain cumulative statistics for the rating and declared accuracy by language and model, prompt and rubric version. These statistics contain no analysis identifier, comment, role, response date, CV content or report content and cannot be used to restore the deleted report. The raw comment and its link to the analysis are deleted with the report." : "Gdy dobrowolnie oceniasz raport, zachowujemy zbiorcze statystyki oceny i deklarowanej trafności według języka oraz wersji modelu, promptu i kryteriów. Statystyki nie zawierają identyfikatora analizy, komentarza, roli, daty odpowiedzi ani treści CV lub raportu i nie pozwalają odtworzyć usuniętego raportu. Surowy komentarz oraz jego powiązanie z analizą są usuwane razem z raportem."}</p></section>
    <section><h2>{en ? "Processors" : "Podmioty przetwarzające"}</h2><p>{en ? "OpenAI processes text for the AI review, Supabase stores the private report and operational records, Stripe handles payment, and Vercel hosts the application. Google measurement tools run only after optional consent and never receive CV, job-description or report content." : "OpenAI przetwarza tekst na potrzeby analizy AI, Supabase przechowuje prywatny raport i dane operacyjne, Stripe obsługuje płatność, a Vercel hostuje aplikację. Narzędzia pomiarowe Google działają wyłącznie po opcjonalnej zgodzie i nigdy nie otrzymują treści CV, ogłoszenia ani raportu."}</p></section>
    <section><h2>{en ? "Your controls" : "Twoje uprawnienia i kontrola"}</h2><p>{en ? "You can delete a report immediately from the report screen or use the deletion instructions. You may also contact the service provider to exercise applicable data rights." : "Raport możesz usunąć natychmiast z jego ekranu albo skorzystać z instrukcji usuwania danych. Możesz również skontaktować się z usługodawcą w sprawie praw wynikających z przepisów o ochronie danych."}</p></section>
  </>;
  if (kind === "cookies") return <>
    <section><h2>{en ? "Necessary storage" : "Niezbędne dane w przeglądarce"}</h2><p>{en ? "We use local or session storage for privacy choices, safe campaign attribution and purchase-event deduplication. A secure HttpOnly cookie keeps access to a private report. These functions are required for security or the requested service." : "Używamy local lub session storage do zapamiętania ustawień prywatności, bezpiecznej atrybucji kampanii i deduplikacji zdarzenia zakupu. Bezpieczne cookie HttpOnly utrzymuje dostęp do prywatnego raportu. Te mechanizmy są konieczne dla bezpieczeństwa lub realizacji żądanej usługi."}</p></section>
    <section><h2>{en ? "Optional measurement" : "Opcjonalny pomiar"}</h2><p>{en ? "Google Analytics and Google Ads measurement run only after you accept optional measurement. You can reject it as easily as accept it and reopen privacy settings from any public page." : "Google Analytics i pomiar Google Ads uruchamiamy dopiero po zaakceptowaniu opcjonalnego pomiaru. Odrzucenie jest równie łatwe jak akceptacja, a ustawienia prywatności można ponownie otworzyć na każdej publicznej stronie."}</p></section>
  </>;
  if (kind === "delete") return <>
    <section><h2>{en ? "Delete an active report" : "Usuń aktywny raport"}</h2><p>{en ? "Open the private report and choose ‘Delete report’. The request removes the analysis, report, payment link metadata, raw comment and feedback linked to that analysis. Non-identifying cumulative rating statistics described in the privacy policy may remain. The action cannot be undone." : "Otwórz prywatny raport i wybierz „Usuń raport”. Żądanie usuwa analizę, raport, metadane powiązania płatności, surowy komentarz oraz feedback powiązany z tą analizą. Mogą pozostać nieidentyfikujące zbiorcze statystyki ocen opisane w polityce prywatności. Operacji nie można cofnąć."}</p></section>
    <section><h2>{en ? "Lost access" : "Brak dostępu do raportu"}</h2><p>{en ? "If you no longer have access, contact the service provider. For security, deletion cannot be performed from a public token placed in a query string and may require verification sufficient to identify the relevant record without exposing CV content." : "Jeśli nie masz już dostępu, skontaktuj się z usługodawcą. Ze względów bezpieczeństwa usunięcia nie wykonujemy na podstawie publicznego sekretu w query stringu i możemy poprosić o weryfikację wystarczającą do wskazania rekordu bez ujawniania treści CV."}</p></section>
  </>;
  if (kind === "contact") return <>
    <section><h2>{en ? "Service provider" : "Usługodawca"}</h2><ProviderDetails locale={locale} includeEmail={false}/></section>
    <section><h2>{en ? "Support" : "Wsparcie"}</h2><p>{brand.supportEmail ? <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> : content[locale].missing}</p></section>
  </>;
  return <>
    <section><h2>{en ? "Service" : "Usługa"}</h2><p>{en ? "The service analyses how experience is presented in a CV. It does not assess the person, guarantee an interview or reproduce a decision made by a specific recruiter. The free result is limited; paid plans unlock the report scope shown before checkout." : "Usługa analizuje sposób przedstawienia doświadczenia w CV. Nie ocenia osoby, nie gwarantuje rozmowy i nie odtwarza decyzji konkretnego rekrutera. Bezpłatny wynik ma ograniczony zakres; płatne warianty odblokowują zakres pokazany przed checkoutem."}</p></section>
    <section><h2>{en ? "Payment and delivery" : "Płatność i dostarczenie"}</h2><p>{en ? "Payment is one-off and processed by Stripe. The final amount and currency are shown in Stripe Checkout. The digital report is made available after server-side payment confirmation. A Stripe receipt is not presented as a Polish tax invoice." : "Płatność jest jednorazowa i obsługiwana przez Stripe. Końcowa kwota i waluta są pokazane w Stripe Checkout. Raport cyfrowy zostaje udostępniony po serwerowym potwierdzeniu płatności. Potwierdzenie Stripe nie jest przedstawiane jako polska faktura podatkowa."}</p></section>
    <section><h2>{en ? "Immediate performance" : "Natychmiastowe rozpoczęcie świadczenia"}</h2><p>{en ? "Before analysis, the user requests that the digital service begins immediately. Any mandatory consumer rights remain applicable under the governing law." : "Przed analizą użytkownik zleca natychmiastowe rozpoczęcie świadczenia usługi cyfrowej. Bezwzględnie obowiązujące prawa konsumenta pozostają zachowane zgodnie z właściwymi przepisami."}</p></section>
    <section><h2>{en ? "Responsible use" : "Odpowiedzialne korzystanie"}</h2><p>{en ? "Do not upload documents you are not authorised to process. Automated abuse, attempts to bypass limits, extract prompts or access another person's report are prohibited." : "Nie przesyłaj dokumentów, których nie masz prawa przetwarzać. Niedozwolone są automatyczne nadużycia, omijanie limitów, próby wydobycia promptów i dostępu do raportu innej osoby."}</p></section>
    <section><h2>{en ? "Provider" : "Usługodawca"}</h2><ProviderDetails locale={locale}/></section>
  </>;
}

export function LegalPage({ locale, kind }: { locale: Locale; kind: LegalPageKind }) {
  const t = content[locale];
  return <main className="legal-page"><header className="site-header container"><Logo locale={locale}/><Link href={homePath(locale)}>{t.back}</Link></header><article className="legal-shell container"><nav>{(["terms","privacy","cookies","delete","contact"] as const).map(page=><Link className={page===kind?"active":""} key={page} href={legalPath(locale,page)}>{t.labels[page]}</Link>)}</nav><div><span className="legal-kicker">{t.reviewed}</span><h1>{t.labels[kind]}</h1><p className="legal-draft">{t.draft}</p><Sections locale={locale} kind={kind}/></div></article></main>;
}
