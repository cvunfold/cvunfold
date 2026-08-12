import Link from "next/link";
import Image from "next/image";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { JsonLd } from "@/components/json-ld";
import { PricingObserver } from "@/components/pricing-observer";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import { PublicHeader } from "@/components/public-header";
import { brand } from "@/lib/brand";
import { analysisPath, articlesPath, legalPath, methodologyPath, sampleReportPath, type Locale } from "@/lib/i18n";
import { formatPlanPrice, PLAN_CATALOG } from "@/lib/plans";
import { absoluteUrl } from "@/lib/seo";

const copy = {
  pl: {
    nav: ["Różnica", "Raport", "Cennik", "FAQ"], navIds: ["roznica", "raport", "cennik", "faq"], switchLabel: "EN",
    eyebrow: "MERYTORYCZNA ANALIZA CV DLA DEVELOPERÓW",
    title: <>Masz doświadczenie.<br/>Czy Twoje CV pokazuje <em>Twój rzeczywisty poziom?</em></>,
    description: "Zobacz, jak rekruter lub hiring manager może odczytać Twoje seniority, ownership, wpływ i techniczną wiarygodność. Każda ważna uwaga wskazuje konkretny fragment CV.",
    primary: "Zobacz, na jaki poziom wygląda moje CV", secondary: "Zobacz przykładowy raport",
    priceLine: `Darmowy wynik wstępny · Pełny raport od ${formatPlanPrice("full_review", "pl")} · Bez konta`,
    trustLine: "Plik źródłowy usuwamy po analizie. Nie dopisujemy faktów, których nie ma w dokumencie.",
    specialty: "Obecnie najmocniej specjalizujemy się w CV Frontend Developerów. Obsługujemy też Backend, Full-stack, Mobile, QA i DevOps / Platform.",
    synthetic: "Dane syntetyczne · przykładowy raport", target: "CEL", level: "POSTRZEGANY POZIOM", first: "PIERWSZE 20 SEKUND", overall: "Wynik ogólny",
    diagnosis: "Wiarygodny technicznie developer. Dokument nie pokazuje jednak jeszcze poziomu odpowiedzialności i wpływu oczekiwanego od Seniora.",
    scores: [["Techniczna wiarygodność", 86], ["Ownership", 54], ["Wpływ i rezultaty", 61]],
    atsEyebrow: "RÓŻNICA W 10 SEKUND", atsTitle: "ATS sprawdza format. My sprawdzamy przekaz.",
    ats: { title: "ATS checker", items: ["Czy system odczyta dokument?", "Czy są odpowiednie słowa kluczowe?", "Czy format jest technicznie poprawny?"] },
    product: { title: brand.name, items: ["Na jaki poziom wygląda kandydatura?", "Czy widać ownership i wpływ?", "Co człowiek zrozumie w pierwszych 20 sekundach?", "Który fragment CV jest dowodem diagnozy?"] },
    secondsTitle: "Pierwsze 20 sekund hiring managera", secondsIntro: "Symulujemy roboczą hipotezę, którą może stworzyć sam dokument — i pokazujemy, co najbardziej mogłoby ją poprawić.",
    seconds: [["Po 5 sekundach", "Widać mocny stack i ostatnią rolę Frontend Developera."], ["Po 10 sekundach", "Doświadczenie wygląda solidnie, ale rezultaty są nierówne."], ["Po 20 sekundach", "Profil techniczny jest wiarygodny; poziom odpowiedzialności pozostaje niejasny."]],
    move: "Co najbardziej mogłoby przesunąć wynik w stronę Interview?", moveAnswer: "W ostatnich trzech rolach widać implementację złożonych funkcji, ale tylko jeden fragment jasno pokazuje decyzję kandydatki. Największy efekt da doprecyzowanie zakresu odpowiedzialności przy migracji checkoutu.",
    disclaimer: "To symulacja pierwszego wrażenia na podstawie samego dokumentu, a nie prawdziwa decyzja rekrutacyjna ani przewidywanie wyniku konkretnej rekrutacji.",
    reportEyebrow: "PEŁNY PRZYKŁAD BEZ UPLOADU", reportTitle: `Tak wygląda raport ${brand.name}`,
    reportCopy: "Dane syntetyczne · fikcyjna kandydatka. Zobacz seniority, pierwsze wrażenie, kategorię, dowód, znaczenie problemu i bezpieczny następny krok.",
    finding: { type: "QUESTION", title: "Ownership migracji jest niewidoczny", evidence: "„Praca przy migracji checkoutu do Next.js we współpracy z zespołem Backend.”", why: "Nie wiadomo, czy kandydatka podejmowała decyzje, czy wykonywała przydzielony fragment.", action: "Dopisz zakres decyzji dopiero po odpowiedzi: za który etap i kompromis odpowiadałaś osobiście?" },
    openReport: "Zobacz pełny przykładowy raport", noFacts: "Sugestia nie dodaje żadnego nowego faktu.",
    checksTitle: "Co sprawdzamy", checks: [["Seniority", "Czy treść potwierdza poziom, a nie tylko tytuł."], ["Ownership", "Czy widać samodzielność i zakres decyzji."], ["Wpływ", "Czy dokument pokazuje zmianę, a nie tylko zadania."], ["Wiarygodność", "Czy stack ma kontekst, ograniczenia i konsekwencje."], ["Pierwsze wrażenie", "Jaki obraz powstaje po 5, 10 i 20 sekundach."], ["Higiena ATS", "Czy dokument jest czytelny technicznie i strukturalnie."]],
    howTitle: "Jak działa analiza", how: [["1", "Prześlij CV", "Tekstowy PDF lub DOCX po polsku albo angielsku."], ["2", "Zobacz wynik wstępny", "Poziom, werdykt, pierwsze wrażenie i jeden dowód — bezpłatnie."], ["3", "Odblokuj pełny raport", "Tylko jeśli diagnoza jest dla Ciebie wartościowa."]],
    promiseTitle: "Nie wymyślamy doświadczenia", promiseCopy: "REWRITE przepisuje wyłącznie istniejącą treść. EXPOSE pokazuje ukryty fakt. GAP oznacza brak dowodu. QUESTION mówi, czego musimy dowiedzieć się od Ciebie.",
    pricingTitle: "Jedna decyzja. Bez subskrypcji.",
    priceCards: [{ plan: "full_review" as const, title: "Pełna analiza CV", copy: "Dowiedz się, dlaczego CV wygląda na obecny poziom i co poprawić przed kolejną aplikacją.", items: ["postrzegane seniority i pierwsze 20 sekund", "ownership, wpływ i techniczna wiarygodność", "dowody, wszystkie problemy i kolejność poprawek"] }, { plan: "job_match" as const, title: "Analiza CV + dopasowanie do oferty", copy: "Sprawdź również, czy masz odpowiednie doświadczenie źle pokazane w CV.", items: ["wszystko z pełnej analizy", "brakujące umiejętności vs brakujące dowody", "priorytety zmian pod konkretną ofertę"] }],
    select: "Wybieram", oneTime: "Płatność jednorazowa · bez subskrypcji", privateTitle: "Twoje CV nie zostaje z nami", privateCopy: "Dokument przetwarzamy w pamięci i nie zapisujemy pliku źródłowego w storage. Raport wygasa po 30 dniach, a Ty możesz usunąć go wcześniej. Treść CV, ogłoszenia i raportu nigdy nie trafia do analytics.",
    faqTitle: "Najważniejsze pytania", faq: [["Co dostaję bezpłatnie?", "Postrzegany poziom, krótki werdykt, pierwsze wrażenie, jeden najważniejszy problem i konkretny dowód."], ["Czy oceniacie mnie jako specjalistę?", "Nie. Oceniamy wyłącznie sposób przedstawienia doświadczenia w dokumencie."], ["Czy CV może być po angielsku?", "Tak. Analiza obsługuje CV po polsku i angielsku; skanowane PDF-y mogą być nieczytelne."], ["Czy muszę zakładać konto?", "Nie. Dostęp do raportu działa przez prywatną sesję i bezpieczny link."], ["Jak długo przechowujecie raport?", "Domyślnie 30 dni. Możesz usunąć go natychmiast z poziomu raportu."], ["Czy to gwarantuje rozmowę?", "Nie. Symulacja opisuje wrażenie tworzone przez dokument, nie decyzję konkretnego pracodawcy."]],
    articlesTitle: "Dobre CV zaczyna się przed redakcją", articlesCopy: "Trzy krótkie przewodniki o sygnałach, których szuka nasza analiza.",
    articles: [["Ownership", "Dlaczego ownership jest ważny dla pracodawców?", "dlaczego-ownership-jest-wazny-dla-pracodawcow"], ["Seniority", "Jak pokazać seniority bez deklaracji?", "jak-pokazac-seniority-w-cv"], ["Kariera i AI", "Czy AI zastąpi programistów?", "jak-nie-dac-sie-zastapic-przez-ai"]],
    read: "Czytaj", finalTitle: "Sprawdź, co naprawdę komunikuje Twoje CV.", finalCopy: "Wynik wstępny jest bezpłatny. Cena pełnego raportu jest znana przed uploadem.",
    footerCopy: "Merytoryczna analiza CV dla developerów.", footerLinks: ["Prywatność", "Regulamin", "Cookies", "Usuń dane", "Kontakt"],
    methodology: { label: "METODOLOGIA I ODPOWIEDZIALNOŚĆ", title: "To nie jest anonimowy prompt.", copy: "Za metodę i produkt odpowiada Paweł Mączka-Czarnecki — Senior Frontend Developer z 15-letnim doświadczeniem w branży technologicznej, obejmującym prowadzenie zespołów i rozmów technicznych.", link: "Zobacz, jak powstaje analiza" },
  },
  en: {
    nav: ["Difference", "Report", "Pricing", "FAQ"], navIds: ["difference", "report", "pricing", "faq"], switchLabel: "PL",
    eyebrow: "EVIDENCE-BASED CV REVIEW FOR DEVELOPERS",
    title: <>You have the experience.<br/>Does your CV show <em>your real level?</em></>,
    description: "See how a recruiter or hiring manager may read your seniority, ownership, impact and technical credibility. Every important finding points to a specific part of your CV.",
    primary: "See what level my CV communicates", secondary: "View the sample report",
    priceLine: `Free initial result · Full report from ${formatPlanPrice("full_review", "en")} · No account`,
    trustLine: "We delete the source file after analysis. We never add facts that are not in the document.",
    specialty: "We currently specialise most deeply in Frontend Developer CVs. Backend, Full-stack, Mobile, QA and DevOps / Platform are also supported.",
    synthetic: "Synthetic data · sample report", target: "TARGET", level: "PERCEIVED LEVEL", first: "FIRST 20 SECONDS", overall: "Overall score",
    diagnosis: "Technically credible developer. The document does not yet show the level of responsibility and impact expected from a Senior.",
    scores: [["Technical credibility", 86], ["Ownership", 54], ["Impact and outcomes", 61]],
    atsEyebrow: "THE DIFFERENCE IN 10 SECONDS", atsTitle: "ATS checks format. We check the message.",
    ats: { title: "ATS checker", items: ["Can the system read the document?", "Are the right keywords present?", "Is the format technically sound?"] },
    product: { title: brand.name, items: ["What level does the application communicate?", "Are ownership and impact visible?", "What will a person understand in the first 20 seconds?", "Which CV excerpt supports each finding?"] },
    secondsTitle: "The hiring manager's first 20 seconds", secondsIntro: "We simulate the working hypothesis created by the document — and show what could most improve it.",
    seconds: [["After 5 seconds", "A strong stack and the latest Frontend Developer role stand out."], ["After 10 seconds", "The experience looks solid, but outcomes are inconsistent."], ["After 20 seconds", "The technical profile is credible; the level of responsibility is still unclear."]],
    move: "What could most move the outcome towards Interview?", moveAnswer: "The last three roles show complex implementation, but only one excerpt clearly shows a decision owned by the candidate. Clarifying her responsibility during the checkout migration would have the largest effect.",
    disclaimer: "This is a simulation of the first impression created by the document, not a real hiring decision or a prediction for a specific application.",
    reportEyebrow: "A COMPLETE EXAMPLE — NO UPLOAD", reportTitle: `This is a ${brand.name} report`,
    reportCopy: "Synthetic data · fictional candidate. See seniority, first impression, category scores, evidence, why the issue matters and a fact-safe next step.",
    finding: { type: "QUESTION", title: "Ownership of the migration is invisible", evidence: "“Worked on migrating checkout to Next.js with the Backend team.”", why: "It is unclear whether the candidate made decisions or delivered an assigned part.", action: "Add decision scope only after answering: which stage and trade-off did you personally own?" },
    openReport: "View the full sample report", noFacts: "This suggestion adds no new facts.",
    checksTitle: "What we review", checks: [["Seniority", "Does the content support the level, not just the title?"], ["Ownership", "Are autonomy and decision scope visible?"], ["Impact", "Does the document show change, not only tasks?"], ["Credibility", "Does the stack have context, constraints and consequences?"], ["First impression", "What picture forms after 5, 10 and 20 seconds?"], ["ATS hygiene", "Is the document technically and structurally readable?"]],
    howTitle: "How the review works", how: [["1", "Upload your CV", "A text-based PDF or DOCX in English or Polish."], ["2", "See the initial result", "Level, verdict, first impression and one evidence-backed finding — free."], ["3", "Unlock the full report", "Only if the diagnosis is useful to you."]],
    promiseTitle: "We never invent experience", promiseCopy: "REWRITE only rephrases existing content. EXPOSE surfaces a hidden fact. GAP means there is no visible evidence. QUESTION tells you what we still need to learn from you.",
    pricingTitle: "One decision. No subscription.",
    priceCards: [{ plan: "full_review" as const, title: "Full CV review", copy: "Learn why your CV communicates its current level and what to improve before your next application.", items: ["perceived seniority and the first 20 seconds", "ownership, impact and technical credibility", "evidence, every issue and an ordered action plan"] }, { plan: "job_match" as const, title: "CV review + job matching", copy: "Also learn whether relevant experience is present but poorly exposed in your CV.", items: ["everything in the full review", "missing skills versus missing evidence", "priorities tailored to a specific role"] }],
    select: "Choose", oneTime: "One-time payment · no subscription", privateTitle: "Your CV does not stay with us", privateCopy: "The document is processed in memory; we do not store the source file. The report expires after 30 days and you can delete it sooner. CV, job-description and report content never goes to analytics.",
    faqTitle: "Key questions", faq: [["What do I get for free?", "Perceived level, a short verdict, first impression, the most important issue and one specific piece of evidence."], ["Do you assess me as a professional?", "No. We only assess how experience is presented in the document."], ["Can my CV be in Polish?", "Yes. The review supports English and Polish CVs; scanned PDFs may be unreadable."], ["Do I need an account?", "No. Report access uses a private session and a secure link."], ["How long is the report stored?", "Thirty days by default. You can delete it immediately from the report."], ["Does this guarantee an interview?", "No. The simulation describes the impression created by the document, not a specific employer's decision."]],
    articlesTitle: "A strong CV starts before editing", articlesCopy: "Three practical guides to the signals our review looks for.",
    articles: [["Ownership", "Why does ownership matter to employers?", "why-ownership-matters-to-employers"], ["Seniority", "How do you show seniority without declaring it?", "how-to-show-seniority-in-a-cv"], ["Career and AI", "Will AI replace software developers?", "how-to-stay-relevant-in-the-age-of-ai"]],
    read: "Read", finalTitle: "See what your CV really communicates.", finalCopy: "The initial result is free. The full report price is clear before upload.",
    footerCopy: "Evidence-based CV review for developers.", footerLinks: ["Privacy", "Terms", "Cookies", "Delete data", "Contact"],
    methodology: { label: "METHODOLOGY AND ACCOUNTABILITY", title: "This is not an anonymous prompt.", copy: "The method and product are owned by Paweł Mączka-Czarnecki — a Senior Frontend Developer with 15 years in technology, including team leadership and technical interviews.", link: "See how the review is produced" },
  },
} as const;

export function LandingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const switchPath = locale === "pl" ? "/en" : "/";
  const sectionIds = t.navIds;
  const reportUrl = sampleReportPath(locale);
  const pageUrl = absoluteUrl(locale === "pl" ? "/" : "/en");
  const serviceId = `${pageUrl}#service`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: brand.name, alternateName: "CVUnfold", url: absoluteUrl("/") },
      { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website`, name: brand.name, alternateName: "CVUnfold", url: absoluteUrl("/"), publisher: { "@id": `${absoluteUrl("/")}#organization` }, inLanguage: ["pl", "en"] },
      { "@type": "WebPage", "@id": `${pageUrl}#webpage`, name: locale === "pl" ? "Analiza CV developera" : "Developer CV review", url: pageUrl, isPartOf: { "@id": `${absoluteUrl("/")}#website` }, about: { "@id": serviceId }, inLanguage: locale },
      { "@type": "Service", "@id": serviceId, name: locale === "pl" ? "Analiza CV developera" : "Developer CV review", serviceType: "Evidence-based CV review", provider: { "@id": `${absoluteUrl("/")}#organization` }, areaServed: locale === "pl" ? { "@type": "Country", name: "Poland" } : "Worldwide", availableLanguage: ["Polish", "English"], offers: (["full_review", "job_match"] as const).map((plan) => ({ "@type": "Offer", name: t.priceCards.find((card) => card.plan === plan)?.title, price: String(PLAN_CATALOG[locale][plan].amountMinor / 100), priceCurrency: PLAN_CATALOG[locale][plan].currency, url: absoluteUrl(analysisPath(locale, plan === "job_match")), availability: "https://schema.org/InStock" })) },
    ],
  };
  return <main className="landing-page launch-landing">
    <JsonLd data={structuredData}/>
    <PricingObserver locale={locale} targetId={sectionIds[2]}/>
    <PublicHeader locale={locale} languageHref={switchPath} homePage/>

    <section className="launch-hero container"><div className="hero-copy"><span className="launch-eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.description}</p><div className="hero-actions"><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="hero">{t.primary}<ArrowIcon/></Link><Link className="secondary-button" href={reportUrl} data-analytics-event="sample_report_viewed" data-analytics-placement="hero">{t.secondary}</Link></div><strong className="launch-price-line">{t.priceLine}</strong><p className="launch-trust"><LockIcon/>{t.trustLine}</p><small className="launch-specialty">{t.specialty}</small></div>
      <article className="level-demo" aria-label={t.synthetic}><header><span>{t.synthetic}</span><small>01 / 04</small></header><div className="level-demo-main"><div><small>{t.target}</small><strong>Senior Frontend Developer</strong></div><div><small>{t.level}</small><strong>Mid+ / Senior−</strong></div><div><small>{t.first}</small><strong className="maybe">MAYBE</strong></div></div><p>{t.diagnosis}</p><div className="level-score-list">{t.scores.map(([label, score]) => <div key={label}><span>{label}</span><i><b style={{width: `${score}%`}}/></i><strong>{score}</strong></div>)}</div><footer><span>{t.overall}</span><ScoreRing score={72} compact ariaLabel={locale === "pl" ? "Wynik 72 na 100" : "Score 72 out of 100"} statusLabel={locale === "pl" ? "Dobry kierunek" : "Good direction"}/></footer></article>
    </section>

    <section id={sectionIds[0]} className="ats-section"><div className="container"><header className="launch-section-head"><span>{t.atsEyebrow}</span><h2>{t.atsTitle}</h2></header><div className="ats-compare"><article><h3>{t.ats.title}</h3><ul>{t.ats.items.map((item) => <li key={item}>{item}</li>)}</ul></article><article className="product-compare"><h3>{t.product.title}</h3><ul>{t.product.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul></article></div></div></section>

    <section className="seconds-showcase container"><div className="launch-section-head"><span>05 → 20 SEC</span><h2>{t.secondsTitle}</h2><p>{t.secondsIntro}</p></div><div className="seconds-cards">{t.seconds.map(([label, text], index) => <article key={label}><b>{String((index + 1) * 5).padStart(2, "0")}</b><h3>{label}</h3><p>{text}</p></article>)}<aside><span>SIMULATION</span><strong>MAYBE</strong></aside></div><div className="move-interview"><h3>{t.move}</h3><p>{t.moveAnswer}</p></div><small className="launch-disclaimer">{t.disclaimer}</small></section>

    <section id={sectionIds[1]} className="sample-showcase"><div className="container sample-showcase-grid"><div><div className="launch-section-head"><span>{t.reportEyebrow}</span><h2>{t.reportTitle}</h2><p>{t.reportCopy}</p></div><Link className="button" href={reportUrl} data-analytics-event="sample_report_viewed" data-analytics-placement="sample_section">{t.openReport}<ArrowIcon/></Link></div><article className="sample-finding"><header><span>CRITICAL</span><b>{t.finding.type}</b></header><h3>{t.finding.title}</h3><div><small>EVIDENCE</small><blockquote>{t.finding.evidence}</blockquote></div><div><small>WHY IT MATTERS</small><p>{t.finding.why}</p></div><div><small>ACTION</small><p>{t.finding.action}</p></div><footer><CheckIcon/>{t.noFacts}</footer></article></div></section>

    <section className="compact-section container"><div className="launch-section-head"><span>RUBRIC</span><h2>{t.checksTitle}</h2></div><div className="launch-checks">{t.checks.map(([title, text]) => <article key={title}><CheckIcon/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
    <section id="jak" className="how-section"><div className="container"><div className="launch-section-head"><span>PROCESS</span><h2>{t.howTitle}</h2></div><ol>{t.how.map(([number, title, text]) => <li key={number}><b>{number}</b><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
    <section className="promise-strip"><div className="container"><LockIcon/><div><h2>{t.promiseTitle}</h2><p>{t.promiseCopy}</p></div></div></section>
    <section className="methodology-proof container"><Image src="/images/pawel-maczka-czarnecki.png" width={512} height={512} sizes="(max-width: 720px) 80px, 112px" alt={locale === "pl" ? "Paweł Mączka-Czarnecki, twórca CV Unfold" : "Paweł Mączka-Czarnecki, creator of CV Unfold"}/><div><span>{t.methodology.label}</span><h2>{t.methodology.title}</h2><p>{t.methodology.copy}</p><Link href={methodologyPath(locale)}>{t.methodology.link}<ArrowIcon/></Link></div></section>

    <section id={sectionIds[2]} className="launch-pricing container"><div className="launch-section-head"><span>PRICING</span><h2>{t.pricingTitle}</h2></div><div>{t.priceCards.map((card) => <article key={card.plan}><header><h3>{card.title}</h3><strong>{formatPlanPrice(card.plan, locale)}</strong></header><p>{card.copy}</p><ul>{card.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul><Link className="button" href={analysisPath(locale, card.plan === "job_match")} data-analytics-event="hero_cta_clicked" data-analytics-placement={`pricing_${card.plan}`}>{t.select}<ArrowIcon/></Link><small>{t.oneTime}</small></article>)}</div></section>
    <section className="privacy-strip"><div className="container"><LockIcon/><div><h2>{t.privateTitle}</h2><p>{t.privateCopy}</p></div><Link href={legalPath(locale, "privacy")}>{t.footerLinks[0]}<ArrowIcon/></Link></div></section>
    <section id={sectionIds[3]} className="launch-faq container"><div className="launch-section-head"><span>FAQ</span><h2>{t.faqTitle}</h2></div><div>{t.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

    <section className="launch-articles container"><div className="launch-section-head"><span>KNOWLEDGE</span><h2>{t.articlesTitle}</h2><p>{t.articlesCopy}</p></div><div>{t.articles.map(([category, title, slug]) => <article key={slug}><span>{category}</span><h3><Link href={`${articlesPath(locale)}/${slug}`}>{title}</Link></h3><Link href={`${articlesPath(locale)}/${slug}`}>{t.read}<ArrowIcon/></Link></article>)}</div><Link className="all-articles" href={articlesPath(locale)}>{locale === "pl" ? "Wszystkie artykuły" : "All articles"}<ArrowIcon/></Link></section>
    <section className="final-cta"><div className="container"><div><h2>{t.finalTitle}</h2><p>{t.finalCopy}</p></div><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="final">{t.primary}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer launch-footer container"><div><Logo locale={locale}/><p>{t.footerCopy}</p></div><nav><Link href={methodologyPath(locale)}>{locale === "pl" ? "Metodologia" : "Methodology"}</Link>{(["privacy", "terms", "cookies", "delete", "contact"] as const).map((page, index) => <Link key={page} href={legalPath(locale, page)}>{t.footerLinks[index]}</Link>)}</nav><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
    <MobileStickyCta href={analysisPath(locale)} label={locale === "pl" ? "Sprawdź CV" : "Review my CV"} price={formatPlanPrice("full_review", locale)}/>
  </main>;
}
