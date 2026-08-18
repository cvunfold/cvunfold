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
    title: <>Twoje CV ma kilka sekund.<br/>Czy pokazuje <em>to, co potrafisz?</em></>,
    description: "Sprawdź, co hiring manager zrozumie z Twojego CV w pierwszych 20 sekundach — czy widać odpowiedzialność, wpływ i techniczną wiarygodność. Oceniamy dokument, nie Ciebie, a każda ważna uwaga wskazuje konkretny fragment CV.",
    primary: "Sprawdź, co pokazuje moje CV", secondary: "Zobacz przykładowy raport",
    priceLine: `Darmowy wynik wstępny · Pełny raport od ${formatPlanPrice("full_review", "pl")} · Bez konta`,
    trustLine: "Plik źródłowy usuwamy po analizie. Nie dopisujemy faktów, których nie ma w dokumencie.",
    specialty: "Obecnie najmocniej specjalizujemy się w CV Frontend Developerów. Obsługujemy też Backend, Full-stack, Mobile, QA i DevOps / Platform — na różnych etapach kariery.",
    synthetic: "Dane syntetyczne · przykładowy raport", target: "CEL", targetValue: "Senior Frontend Developer", level: "POSTRZEGANY POZIOM", levelValue: "Senior", first: "PIERWSZE 20 SEKUND", overall: "Ogólna jakość komunikacji CV",
    diagnosis: "Doświadczony Senior Frontend. Najmocniejsze dowody wydajności i architektury są w starszej roli; najnowsza słabiej pokazuje rezultat i indywidualny ownership.",
    scores: [["Wiarygodność frontendowa", 86], ["Architektura", 82], ["Ownership i odpowiedzialność", 76]],
    atsEyebrow: "RÓŻNICA W 10 SEKUND", atsTitle: "ATS sprawdza format. My sprawdzamy przekaz.",
    ats: { title: "ATS checker", items: ["Czy system odczyta dokument?", "Czy są odpowiednie słowa kluczowe?", "Czy format jest technicznie poprawny?"] },
    product: { title: brand.name, items: ["Czy najważniejsze doświadczenie jest widoczne?", "Czy widać odpowiedzialność i wpływ?", "Co człowiek zrozumie w pierwszych 20 sekundach?", "Który fragment CV jest dowodem diagnozy?"] },
    agent: {
      eyebrow: "DIAGNOZA PRZED REDAKCJĄ",
      title: "Masz już własnego agenta AI? Świetnie.",
      subtitle: "Użyj go do redakcji. CV Unfold służy do diagnozy.",
      lead: "Agent może pomóc przepisać zdania. CV Unfold najpierw sprawdza, co dokument naprawdę komunikuje, gdzie traci wiarygodność i które poprawki mają największy wpływ.",
      process: [
        ["Rubryka roli", "Kryteria zależą od wybranej roli i celu zawodowego."],
        ["Dowód", "Każda ważna diagnoza wskazuje fragment CV albo jawnie oznacza brak dowodu."],
        ["Priorytet", "Najpierw problemy zmieniające odbiór doświadczenia, odpowiedzialności i wpływu; później redakcja."],
        ["Typ działania", "Raport określa, co można bezpiecznie zrobić bez dopisywania doświadczenia."],
      ],
      actions: [
        ["REWRITE", "przeredaguj istniejący fakt"],
        ["EXPOSE", "pokaż wyraźniej istniejący dowód"],
        ["GAP", "dokument nie pokazuje potrzebnego dowodu"],
        ["QUESTION", "odpowiedz tylko wtedy, gdy fakt jest prawdziwy"],
      ],
      yours: "Twój agent AI: redakcja, warianty i dopracowanie języka",
      ours: "CV Unfold: diagnoza, dowody, priorytety i kontrola faktów",
      link: "Zobacz pełną metodologię",
    },
    secondsTitle: "Pierwsze 20 sekund hiring managera", secondsIntro: "Symulujemy roboczą hipotezę, którą może stworzyć sam dokument — i pokazujemy, co najbardziej mogłoby ją poprawić.",
    seconds: [["Po 5 sekundach", "Widać mocny stack i ostatnią rolę Frontend Developera."], ["Po 10 sekundach", "Doświadczenie wygląda solidnie, ale rezultaty są nierówne."], ["Po 20 sekundach", "Profil techniczny jest wiarygodny; poziom odpowiedzialności pozostaje niejasny."]],
    move: "Co najbardziej mogłoby przesunąć wynik w stronę Interview?", moveAnswer: "W ostatnich trzech rolach widać implementację złożonych funkcji, ale tylko jeden fragment jasno pokazuje decyzję kandydatki. Największy efekt da doprecyzowanie zakresu odpowiedzialności przy migracji checkoutu.",
    disclaimer: "To symulacja pierwszego wrażenia na podstawie samego dokumentu, a nie prawdziwa decyzja rekrutacyjna ani przewidywanie wyniku konkretnej rekrutacji.",
    reportEyebrow: "PEŁNY PRZYKŁAD BEZ UPLOADU", reportTitle: `Tak wygląda raport ${brand.name}`,
    reportCopy: "Dane syntetyczne · fikcyjna kandydatka. Zobacz pierwsze wrażenie, ocenę kategorii, dowód, znaczenie problemu i bezpieczny następny krok.",
    finding: { type: "QUESTION", title: "Ownership migracji jest niewidoczny", evidence: "„Praca przy migracji checkoutu do Next.js we współpracy z zespołem Backend.”", why: "Nie wiadomo, czy kandydatka podejmowała decyzje, czy wykonywała przydzielony fragment.", action: "Dopisz zakres decyzji dopiero po odpowiedzi: za który etap i kompromis odpowiadałaś osobiście?" },
    openReport: "Zobacz pełny przykładowy raport", noFacts: "Sugestia nie dodaje żadnego nowego faktu.",
    checksTitle: "Co sprawdzamy", checks: [["Doświadczenie", "Czy najważniejsze role i projekty budują czytelny obraz specjalizacji."], ["Odpowiedzialność", "Czy widać samodzielność i zakres decyzji."], ["Wpływ", "Czy dokument pokazuje zmianę, a nie tylko zadania."], ["Wiarygodność", "Czy stack ma kontekst, ograniczenia i konsekwencje."], ["Pierwsze wrażenie", "Jaki obraz powstaje po 5, 10 i 20 sekundach."], ["Higiena ATS", "Czy dokument jest czytelny technicznie i strukturalnie."]],
    howTitle: "Jak działa analiza", how: [["1", "Prześlij CV", "Tekstowy PDF lub DOCX po polsku albo angielsku."], ["2", "Zobacz wynik wstępny", "Werdykt, pierwsze wrażenie i jeden konkretny dowód — bezpłatnie."], ["3", "Odblokuj pełny raport", "Tylko jeśli diagnoza jest dla Ciebie wartościowa."]],
    promiseTitle: "Nie wymyślamy doświadczenia", promiseCopy: "REWRITE przepisuje wyłącznie istniejącą treść. EXPOSE pokazuje ukryty fakt. GAP oznacza brak dowodu. QUESTION mówi, czego musimy dowiedzieć się od Ciebie.",
    pricingTitle: "Jedna decyzja. Bez subskrypcji.",
    pricingLead: "Najpierw zobaczysz bezpłatny wynik wstępny. Płacisz dopiero, jeśli chcesz odblokować pełną diagnozę.",
    priceCards: [{ plan: "full_review" as const, title: "Pełna analiza CV", copy: "Dowiedz się, co CV komunikuje i co poprawić przed kolejną aplikacją.", cta: "Zacznij od darmowego wyniku", items: ["pierwsze 20 sekund i najważniejsze ryzyko", "odpowiedzialność, wpływ i techniczna wiarygodność", "dowody, wszystkie problemy i kolejność poprawek"] }, { plan: "job_match" as const, title: "Analiza CV + dopasowanie do oferty", copy: "Sprawdź również, czy masz odpowiednie doświadczenie źle pokazane w CV.", cta: "Rozpocznij analizę pod ofertę", items: ["wszystko z pełnej analizy", "brakujące umiejętności vs brakujące dowody", "priorytety zmian pod konkretną ofertę"] }],
    oneTime: "Płatność jednorazowa · bez subskrypcji", privateTitle: "Twoje CV nie zostaje z nami", privateCopy: "Dokument przetwarzamy w pamięci i nie zapisujemy pliku źródłowego w storage. Raport wygasa po 30 dniach, a Ty możesz usunąć go wcześniej. Treść CV, ogłoszenia i raportu nigdy nie trafia do analytics.",
    faqTitle: "Najważniejsze pytania", faq: [["Co dostaję bezpłatnie?", "Krótki werdykt, pierwsze wrażenie, jeden najważniejszy problem i konkretny dowód."], ["Czy oceniacie mnie jako specjalistę?", "Nie. Oceniamy wyłącznie sposób przedstawienia doświadczenia w dokumencie."], ["Czy CV może być po angielsku?", "Tak. Analiza obsługuje CV po polsku i angielsku; skanowane PDF-y mogą być nieczytelne."], ["Czy muszę zakładać konto?", "Nie. Dostęp do raportu działa przez prywatną sesję i bezpieczny link."], ["Jak długo przechowujecie raport?", "Domyślnie 30 dni. Możesz usunąć go natychmiast z poziomu raportu."], ["Czy to gwarantuje rozmowę?", "Nie. Symulacja opisuje wrażenie tworzone przez dokument, nie decyzję konkretnego pracodawcy."]],
    articlesTitle: "Dobre CV zaczyna się przed redakcją", articlesCopy: "Trzy krótkie przewodniki o sygnałach, których szuka nasza analiza.",
    articles: [["Ownership", "Dlaczego ownership jest ważny dla pracodawców?", "dlaczego-ownership-jest-wazny-dla-pracodawcow"], ["Wpływ", "Obowiązki to nie rezultaty. Jak opisywać wpływ?", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"], ["Kariera i AI", "Czy AI zastąpi programistów?", "jak-nie-dac-sie-zastapic-przez-ai"]],
    read: "Czytaj", finalTitle: "Sprawdź, co naprawdę komunikuje Twoje CV.", finalCopy: "Wynik wstępny jest bezpłatny. Cena pełnego raportu jest znana przed uploadem.",
    footerCopy: "Analiza CV oparta na dowodach z dokumentu.", footerLinks: ["Prywatność", "Regulamin", "Cookies", "Usuń dane", "Kontakt"],
    methodology: { label: "METODOLOGIA I ODPOWIEDZIALNOŚĆ", title: "Metoda ma właściciela i wersje.", copy: "Za metodę i produkt odpowiada Paweł Mączka-Czarnecki — Senior Frontend Developer z 15-letnim doświadczeniem w branży technologicznej, obejmującym prowadzenie zespołów i rozmów technicznych. Zasady analizy są jawne i wersjonowane.", link: "Zobacz, jak powstaje analiza" },
  },
  en: {
    nav: ["Difference", "Report", "Pricing", "FAQ"], navIds: ["difference", "report", "pricing", "faq"], switchLabel: "PL",
    title: <>Your CV has a few seconds.<br/>Does it show <em>what you can do?</em></>,
    description: "See what a hiring manager understands from your CV in the first 20 seconds — whether responsibility, impact and technical credibility are visible. We assess the document, not you, and every important finding points to a specific excerpt.",
    primary: "See what my CV communicates", secondary: "View the sample report",
    priceLine: `Free initial result · Full report from ${formatPlanPrice("full_review", "en")} · No account`,
    trustLine: "We delete the source file after analysis. We never add facts that are not in the document.",
    specialty: "We currently specialise most deeply in Frontend Developer CVs. Backend, Full-stack, Mobile, QA and DevOps / Platform are also supported across different career stages.",
    synthetic: "Synthetic data · sample report", target: "TARGET", targetValue: "Senior Frontend Developer", level: "PERCEIVED LEVEL", levelValue: "Senior", first: "FIRST 20 SECONDS", overall: "Overall CV communication quality",
    diagnosis: "An experienced Senior Frontend profile. Performance and architecture evidence is strongest in the earlier role; the latest role shows results and individual ownership less clearly.",
    scores: [["Frontend credibility", 86], ["Architecture", 82], ["Ownership and responsibility", 76]],
    atsEyebrow: "THE DIFFERENCE IN 10 SECONDS", atsTitle: "ATS checks format. We check the message.",
    ats: { title: "ATS checker", items: ["Can the system read the document?", "Are the right keywords present?", "Is the format technically sound?"] },
    product: { title: brand.name, items: ["Is the most relevant experience visible?", "Are responsibility and impact clear?", "What will a person understand in the first 20 seconds?", "Which CV excerpt supports each finding?"] },
    agent: {
      eyebrow: "DIAGNOSIS BEFORE EDITING",
      title: "Already have your own AI agent? Great.",
      subtitle: "Use it for editing. CV Unfold is for diagnosis.",
      lead: "An agent can help rewrite sentences. CV Unfold first checks what the document actually communicates, where it loses credibility and which changes could have the greatest impact.",
      process: [
        ["Role rubric", "Criteria depend on the selected role and career goal."],
        ["Evidence", "Every important diagnosis points to a CV excerpt or explicitly marks missing evidence."],
        ["Priority", "Issues affecting perceived experience, responsibility and impact come first; editing comes later."],
        ["Action type", "The report states what can be done safely without adding experience."],
      ],
      actions: [
        ["REWRITE", "rephrase an existing fact"],
        ["EXPOSE", "make existing evidence more visible"],
        ["GAP", "the document does not show the required evidence"],
        ["QUESTION", "answer only when the fact is true"],
      ],
      yours: "Your AI agent: editing, alternatives and language refinement",
      ours: "CV Unfold: diagnosis, evidence, priorities and fact control",
      link: "See the full methodology",
    },
    secondsTitle: "The hiring manager's first 20 seconds", secondsIntro: "We simulate the working hypothesis created by the document — and show what could most improve it.",
    seconds: [["After 5 seconds", "A strong stack and the latest Frontend Developer role stand out."], ["After 10 seconds", "The experience looks solid, but outcomes are inconsistent."], ["After 20 seconds", "The technical profile is credible; the level of responsibility is still unclear."]],
    move: "What could most move the outcome towards Interview?", moveAnswer: "The last three roles show complex implementation, but only one excerpt clearly shows a decision owned by the candidate. Clarifying her responsibility during the checkout migration would have the largest effect.",
    disclaimer: "This is a simulation of the first impression created by the document, not a real hiring decision or a prediction for a specific application.",
    reportEyebrow: "A COMPLETE EXAMPLE — NO UPLOAD", reportTitle: `This is a ${brand.name} report`,
    reportCopy: "Synthetic data · fictional candidate. See first impression, category scores, evidence, why the issue matters and a fact-safe next step.",
    finding: { type: "QUESTION", title: "Ownership of the migration is invisible", evidence: "“Worked on migrating checkout to Next.js with the Backend team.”", why: "It is unclear whether the candidate made decisions or delivered an assigned part.", action: "Add decision scope only after answering: which stage and trade-off did you personally own?" },
    openReport: "View the full sample report", noFacts: "This suggestion adds no new facts.",
    checksTitle: "What we review", checks: [["Experience", "Do the most important roles and projects create a clear picture of your specialism?"], ["Responsibility", "Are autonomy and decision scope visible?"], ["Impact", "Does the document show change, not only tasks?"], ["Credibility", "Does the stack have context, constraints and consequences?"], ["First impression", "What picture forms after 5, 10 and 20 seconds?"], ["ATS hygiene", "Is the document technically and structurally readable?"]],
    howTitle: "How the review works", how: [["1", "Upload your CV", "A text-based PDF or DOCX in English or Polish."], ["2", "See the initial result", "A verdict, first impression and one evidence-backed finding — free."], ["3", "Unlock the full report", "Only if the diagnosis is useful to you."]],
    promiseTitle: "We never invent experience", promiseCopy: "REWRITE only rephrases existing content. EXPOSE surfaces a hidden fact. GAP means there is no visible evidence. QUESTION tells you what we still need to learn from you.",
    pricingTitle: "One decision. No subscription.",
    pricingLead: "You see the free initial result first. You only pay if you want to unlock the complete diagnosis.",
    priceCards: [{ plan: "full_review" as const, title: "Full CV review", copy: "Learn what your CV communicates and what to improve before your next application.", cta: "Start with the free result", items: ["the first 20 seconds and the most important risk", "responsibility, impact and technical credibility", "evidence, every issue and an ordered action plan"] }, { plan: "job_match" as const, title: "CV review + job matching", copy: "Also learn whether relevant experience is present but poorly exposed in your CV.", cta: "Start a job-specific review", items: ["everything in the full review", "missing skills versus missing evidence", "priorities tailored to a specific role"] }],
    oneTime: "One-time payment · no subscription", privateTitle: "Your CV does not stay with us", privateCopy: "The document is processed in memory; we do not store the source file. The report expires after 30 days and you can delete it sooner. CV, job-description and report content never goes to analytics.",
    faqTitle: "Key questions", faq: [["What do I get for free?", "A short verdict, first impression, the most important issue and one specific piece of evidence."], ["Do you assess me as a professional?", "No. We only assess how experience is presented in the document."], ["Can my CV be in Polish?", "Yes. The review supports English and Polish CVs; scanned PDFs may be unreadable."], ["Do I need an account?", "No. Report access uses a private session and a secure link."], ["How long is the report stored?", "Thirty days by default. You can delete it immediately from the report."], ["Does this guarantee an interview?", "No. The simulation describes the impression created by the document, not a specific employer's decision."]],
    articlesTitle: "A strong CV starts before editing", articlesCopy: "Three practical guides to the signals our review looks for.",
    articles: [["Ownership", "Why does ownership matter to employers?", "why-ownership-matters-to-employers"], ["Impact", "Responsibilities are not outcomes. How do you show impact?", "responsibilities-are-not-outcomes"], ["Career and AI", "Will AI replace software developers?", "how-to-stay-relevant-in-the-age-of-ai"]],
    read: "Read", finalTitle: "See what your CV really communicates.", finalCopy: "The initial result is free. The full report price is clear before upload.",
    footerCopy: "A CV review grounded in evidence from the document.", footerLinks: ["Privacy", "Terms", "Cookies", "Delete data", "Contact"],
    methodology: { label: "METHODOLOGY AND ACCOUNTABILITY", title: "The method has an owner and versions.", copy: "The method and product are owned by Paweł Mączka-Czarnecki — a Senior Frontend Developer with 15 years in technology, including team leadership and technical interviews. The review rules are public and versioned.", link: "See how the review is produced" },
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

    <section className="launch-hero container"><div className="hero-copy"><h1>{t.title}</h1><p>{t.description}</p><div className="hero-actions"><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="hero">{t.primary}<ArrowIcon/></Link><Link className="secondary-button" href={reportUrl}>{t.secondary}</Link></div><strong className="launch-price-line">{t.priceLine}</strong><p className="launch-trust"><LockIcon/>{t.trustLine}</p><small className="launch-specialty">{t.specialty}</small></div>
      <article className="level-demo" aria-label={t.synthetic}><header><span>{t.synthetic}</span><small>01 / 04</small></header><div className="level-demo-main"><div><small>{t.target}</small><strong>{t.targetValue}</strong></div><div><small>{t.level}</small><strong>{t.levelValue}</strong></div><div><small>{t.first}</small><strong className="interview">INTERVIEW</strong></div></div><p>{t.diagnosis}</p><div className="level-score-list">{t.scores.map(([label, score]) => <div key={label}><span>{label}</span><i><b style={{width: `${score}%`}}/></i><strong>{score}</strong></div>)}</div><footer><span>{t.overall}</span><ScoreRing score={79} compact ariaLabel={locale === "pl" ? "Wynik 79 na 100" : "Score 79 out of 100"} locale={locale}/></footer></article>
    </section>

    <section id={sectionIds[0]} className="ats-section"><div className="container"><header className="launch-section-head"><span>{t.atsEyebrow}</span><h2>{t.atsTitle}</h2></header><div className="ats-compare"><article><h3>{t.ats.title}</h3><ul>{t.ats.items.map((item) => <li key={item}>{item}</li>)}</ul></article><article className="product-compare"><h3>{t.product.title}</h3><ul>{t.product.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul></article></div></div></section>

    <section className="ai-agent-section container" aria-labelledby={`ai-agent-${locale}`}>
      <header className="ai-agent-intro"><span>{t.agent.eyebrow}</span><h2 id={`ai-agent-${locale}`}>{t.agent.title}</h2><h3>{t.agent.subtitle}</h3><p>{t.agent.lead}</p></header>
      <div className="ai-agent-detail">
        <div className="ai-agent-process">{t.agent.process.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        <dl className="ai-agent-actions">{t.agent.actions.map(([type, meaning]) => <div key={type}><dt>{type}</dt><dd>{meaning}</dd></div>)}</dl>
        <div className="ai-agent-compare"><p>{t.agent.yours}</p><p>{t.agent.ours}</p></div>
        <Link className="ai-agent-link" href={methodologyPath(locale)}>{t.agent.link}<ArrowIcon/></Link>
      </div>
    </section>

    <section className="seconds-showcase container"><div className="launch-section-head"><span>05 → 20 SEC</span><h2>{t.secondsTitle}</h2><p>{t.secondsIntro}</p></div><div className="seconds-cards">{t.seconds.map(([label, text], index) => <article key={label}><b>{["05", "10", "20"][index]}</b><h3>{label}</h3><p>{text}</p></article>)}<aside><span>SIMULATION</span><strong>MAYBE</strong></aside></div><div className="move-interview"><h3>{t.move}</h3><p>{t.moveAnswer}</p></div><small className="launch-disclaimer">{t.disclaimer}</small></section>

    <section id={sectionIds[1]} className="sample-showcase"><div className="container sample-showcase-grid"><div><div className="launch-section-head"><span>{t.reportEyebrow}</span><h2>{t.reportTitle}</h2><p>{t.reportCopy}</p></div><Link className="button" href={reportUrl}>{t.openReport}<ArrowIcon/></Link></div><article className="sample-finding"><header><span>CRITICAL</span><b>{t.finding.type}</b></header><h3>{t.finding.title}</h3><div><small>EVIDENCE</small><blockquote>{t.finding.evidence}</blockquote></div><div><small>WHY IT MATTERS</small><p>{t.finding.why}</p></div><div><small>ACTION</small><p>{t.finding.action}</p></div><footer><CheckIcon/>{t.noFacts}</footer></article></div></section>

    <section className="compact-section container"><div className="launch-section-head"><span>RUBRIC</span><h2>{t.checksTitle}</h2></div><div className="launch-checks">{t.checks.map(([title, text]) => <article key={title}><CheckIcon/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
    <section id="jak" className="how-section"><div className="container"><div className="launch-section-head"><span>PROCESS</span><h2>{t.howTitle}</h2></div><ol>{t.how.map(([number, title, text]) => <li key={number}><b>{number}</b><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
    <section className="promise-strip"><div className="container"><LockIcon/><div><h2>{t.promiseTitle}</h2><p>{t.promiseCopy}</p></div></div></section>
    <section className="methodology-proof container"><Image src="/images/pawel-maczka-czarnecki.png" width={512} height={512} sizes="(max-width: 720px) 80px, 112px" alt={locale === "pl" ? "Paweł Mączka-Czarnecki, twórca CV Unfold" : "Paweł Mączka-Czarnecki, creator of CV Unfold"}/><div><span>{t.methodology.label}</span><h2>{t.methodology.title}</h2><p>{t.methodology.copy}</p><Link href={methodologyPath(locale)}>{t.methodology.link}<ArrowIcon/></Link></div></section>

    <section id={sectionIds[2]} className="launch-pricing container"><div className="launch-section-head"><span>PRICING</span><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div><div>{t.priceCards.map((card) => <article key={card.plan}><header><h3>{card.title}</h3><strong>{formatPlanPrice(card.plan, locale)}</strong></header><p>{card.copy}</p><ul>{card.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul><Link className="button" href={analysisPath(locale, card.plan === "job_match")} data-analytics-event="hero_cta_clicked" data-analytics-placement={`pricing_${card.plan}`}>{card.cta}<ArrowIcon/></Link><small>{t.oneTime}</small></article>)}</div></section>
    <section className="privacy-strip"><div className="container"><LockIcon/><div><h2>{t.privateTitle}</h2><p>{t.privateCopy}</p></div><Link href={legalPath(locale, "privacy")}>{t.footerLinks[0]}<ArrowIcon/></Link></div></section>
    <section id={sectionIds[3]} className="launch-faq container"><div className="launch-section-head"><span>FAQ</span><h2>{t.faqTitle}</h2></div><div>{t.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

    <section className="launch-articles container"><div className="launch-section-head"><span>KNOWLEDGE</span><h2>{t.articlesTitle}</h2><p>{t.articlesCopy}</p></div><div>{t.articles.map(([category, title, slug]) => <article key={slug}><span>{category}</span><h3><Link href={`${articlesPath(locale)}/${slug}`}>{title}</Link></h3><Link href={`${articlesPath(locale)}/${slug}`}>{t.read}<ArrowIcon/></Link></article>)}</div><Link className="all-articles" href={articlesPath(locale)}>{locale === "pl" ? "Wszystkie artykuły" : "All articles"}<ArrowIcon/></Link></section>
    <section className="final-cta"><div className="container"><div><h2>{t.finalTitle}</h2><p>{t.finalCopy}</p></div><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="final">{t.primary}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer launch-footer container"><div><Logo locale={locale}/><p>{t.footerCopy}</p></div><nav><Link href={methodologyPath(locale)}>{locale === "pl" ? "Metodologia" : "Methodology"}</Link>{(["privacy", "terms", "cookies", "delete", "contact"] as const).map((page, index) => <Link key={page} href={legalPath(locale, page)}>{t.footerLinks[index]}</Link>)}</nav><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
    <MobileStickyCta href={analysisPath(locale)} label={locale === "pl" ? "Sprawdź CV" : "Review my CV"} price={formatPlanPrice("full_review", locale)}/>
  </main>;
}
