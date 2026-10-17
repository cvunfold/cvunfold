import { CvProductPreview } from "@/components/cv-product-preview";
import { CvReviewOverview } from "@/components/cv-review-overview";
import { MarketingReveal } from "@/components/marketing-reveal";
import { FileCheck2, ScanText, ShieldCheck, NotebookPen, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { JsonLd } from "@/components/json-ld";
import { PricingObserver } from "@/components/pricing-observer";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import { PublicHeader } from "@/components/public-header";
import { FaqSection } from "@/components/faq-section";
import { brand } from "@/lib/brand";
import { cvStoryPath, analysisPath, schoolsPath, articlesPath, legalPath, methodologyPath, sampleReportPath, type Locale } from "@/lib/i18n";
import { formatPlanPrice, PLAN_CATALOG, REWRITE_SERVICE_REFERENCE } from "@/lib/plans";
import { absoluteUrl } from "@/lib/seo";
import { articles } from "@/lib/content/articles";
import { articlesEn } from "@/lib/content/articles-en";
import { featuredArticles } from "@/lib/content/article-navigation";

const copy = {
  pl: {
    nav: ["Różnica", "Raport", "Cennik", "FAQ"], navIds: ["roznica", "raport", "cennik", "faq"], switchLabel: "EN",
    title: <>Zwykle brakuje kilku zdań,<br/><em>nie nowego doświadczenia.</em></>,
    description: "Prześlij CV i bezpłatnie zobacz, jakie robi pierwsze wrażenie, jaki poziom komunikuje i jedną konkretną rzecz do poprawy — wskazaną cytatem z Twojego dokumentu. Pełny raport odblokujesz tylko wtedy, gdy uznasz analizę za wartościową.",
    primary: "Sprawdź swoje CV za darmo", secondary: "Zobacz przykładowy raport — 79/100",
    freeLine: "Za darmo: ATS checker + pierwsze wrażenie + 1 poprawka z cytatem",
    priceLine: `${formatPlanPrice("full_review", "pl")} · pełna analiza + 2 ponowne sprawdzenia`,
    trustLine: "Plik źródłowy usuwamy po analizie. Nie dopisujemy faktów, których nie ma w dokumencie.",
    specialty: "Bez konta i karty płatniczej na start. Kryteria dopasowane do roli i etapu kariery.",
    synthetic: "Dane syntetyczne · przykładowy raport", target: "CEL", targetValue: "Senior Frontend Developer", level: "POSTRZEGANY POZIOM", levelValue: "Senior", first: "PIERWSZE 20 SEKUND", overall: "Ogólna jakość komunikacji CV",
    interviewLabel: "DO ROZMOWY", simulationLabel: "SYMULACJA", maybeLabel: "DO ROZWAŻENIA",
    diagnosis: "Doświadczony Senior Frontend. Najmocniejsze dowody wydajności i architektury są w starszej roli; najnowsza słabiej pokazuje rezultat i indywidualny ownership.",
    scores: [["Wiarygodność frontendowa", 86], ["Architektura", 82], ["Ownership i odpowiedzialność", 76]],
    atsEyebrow: "BEZPŁATNY ATS CHECKER", atsTitle: "ATS checker masz za darmo. Prawdziwa różnica zaczyna się dalej.",
    ats: { title: "ATS checker", items: ["Czy system odczyta dokument?", "Czy sekcje i kolejność tekstu są czytelne?", "Czy format jest technicznie poprawny?"] },
    product: { title: brand.name, items: ["Czy najważniejsze doświadczenie jest widoczne?", "Czy widać odpowiedzialność i wpływ?", "Co człowiek zrozumie w pierwszych 20 sekundach?", "Który fragment CV jest dowodem diagnozy?"] },
    agent: {
      eyebrow: "DIAGNOZA PRZED REDAKCJĄ",
      title: "Gotowy plan poprawek. Także do Twojego AI.",
      subtitle: "Zastosuj zalecenia samodzielnie lub skopiuj podsumowanie do swojego AI. Najpierw sprawdzi ono CV i zapyta tylko o potrzebne brakujące fakty. Poprawki zaproponuje po Twoich odpowiedziach lub zgodzie na redakcję istniejącej treści.",
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
    move: "Co najbardziej mogłoby przesunąć wynik w stronę rozmowy?", moveAnswer: "W ostatnich trzech rolach widać implementację złożonych funkcji, ale tylko jeden fragment jasno pokazuje decyzję kandydatki. Największy efekt da doprecyzowanie zakresu odpowiedzialności przy migracji checkoutu.",
    disclaimer: "To symulacja pierwszego wrażenia na podstawie samego dokumentu, a nie prawdziwa decyzja rekrutacyjna ani przewidywanie wyniku konkretnej rekrutacji.",
    reportEyebrow: "PEŁNY PRZYKŁAD BEZ UPLOADU", reportTitle: `Tak wygląda raport ${brand.name}`,
    reportCopy: "Dane syntetyczne · fikcyjna kandydatka z wynikiem 79/100. Nawet dobre CV dostaje konkretne, możliwe do wdrożenia uwagi — zobacz pierwsze wrażenie, ocenę kategorii, dowód i bezpieczny następny krok.",
    finding: { severity: "Kluczowy", type: "Do doprecyzowania", title: "Ownership migracji jest niewidoczny", evidence: "„Praca przy migracji checkoutu do Next.js we współpracy z zespołem Backend.”", why: "Nie wiadomo, czy kandydatka podejmowała decyzje, czy wykonywała przydzielony fragment.", action: "Dopisz zakres decyzji dopiero po odpowiedzi: za który etap i kompromis odpowiadałaś osobiście?" },
    findingEvidenceLabel: "DOWÓD Z CV", findingMattersLabel: "DLACZEGO TO WAŻNE", findingActionLabel: "CO ZROBIĆ",
    openReport: "Zobacz pełny przykładowy raport", noFacts: "Sugestia nie dodaje żadnego nowego faktu.",
    checksEyebrow: "KRYTERIA", checksTitle: "Co sprawdzamy", checks: [["Doświadczenie", "Czy najważniejsze role i projekty budują czytelny obraz specjalizacji."], ["Odpowiedzialność", "Czy widać samodzielność i zakres decyzji."], ["Wpływ", "Czy dokument pokazuje zmianę, a nie tylko zadania."], ["Wiarygodność", "Czy stack ma kontekst, ograniczenia i konsekwencje."], ["Pierwsze wrażenie", "Jaki obraz powstaje po 5, 10 i 20 sekundach."], ["Higiena ATS", "Czy dokument jest czytelny technicznie i strukturalnie."]],
    howEyebrow: "PROCES", howTitle: "Jak działa analiza", how: [["1", "Prześlij CV", "Tekstowy PDF lub DOCX po polsku albo angielsku."], ["2", "Zobacz wynik wstępny", "Werdykt, pierwsze wrażenie i jeden konkretny dowód — bezpłatnie."], ["3", "Odblokuj pełny raport", "Tylko jeśli diagnoza jest dla Ciebie wartościowa."]],
    promiseTitle: "Nie wymyślamy doświadczenia", promiseCopy: "REWRITE przepisuje wyłącznie istniejącą treść. EXPOSE pokazuje ukryty fakt. GAP oznacza brak dowodu. QUESTION mówi, czego musimy dowiedzieć się od Ciebie.",
    pricingEyebrow: "CENNIK", pricingTitle: "Jedna decyzja. Bez subskrypcji.",
    pricingLead: "Najpierw zobaczysz bezpłatny wynik wstępny. Płacisz dopiero, jeśli chcesz odblokować pełną diagnozę.",
    priceCard: { plan: "full_review" as const, title: "Pełna analiza + 2 sprawdzenia", copy: "Otrzymaj diagnozę, popraw CV i sprawdź je ponownie dwukrotnie w ciągu 30 dni.", cta: "Zacznij od darmowego wyniku", items: ["pierwsze 20 sekund i najważniejsze ryzyko", "odpowiedzialność, wpływ i techniczna wiarygodność", "dowody, wszystkie problemy i kolejność poprawek", "2 ponowne sprawdzenia poprawionego CV w ciągu 30 dni"] },
    priceAnchorTitle: "Za co naprawdę płaci się przy poprawianiu CV",
    priceAnchor: `Przepisanie CV u specjalisty kosztuje zwykle ${REWRITE_SERVICE_REFERENCE.pl} i trwa kilka dni. Najdroższa część tej usługi to nie samo pisanie, tylko decyzja, co w dokumencie zmienić i dlaczego. Dokładnie tę część dostajesz tutaj, na dowodach z Twojego CV. Zdania przepiszesz potem sam albo swoim agentem AI.`,
    oneTime: "Płatność jednorazowa · bez subskrypcji", privateTitle: "Twoje CV nie zostaje z nami", privateCopy: "Nie zapisujemy przesłanego pliku. Prywatny raport jest dostępny przez 30 dni i możesz usunąć go wcześniej. Treść CV i raportu nie trafia do narzędzi statystycznych.",
    faqTitle: "Najważniejsze pytania", faq: [["Co dostaję bezpłatnie?", "Krótki werdykt, pierwsze wrażenie, jeden najważniejszy problem i konkretny dowód."], ["Czy oceniacie mnie jako specjalistę?", "Nie. Oceniamy wyłącznie sposób przedstawienia doświadczenia w dokumencie."], ["Czy CV może być po angielsku?", "Tak. Analiza obsługuje CV po polsku i angielsku; skanowane PDF-y mogą być nieczytelne."], ["Czy muszę zakładać konto?", "Nie. Dostęp do raportu działa przez prywatną sesję i bezpieczny link."], ["Jak długo przechowujecie raport?", "Domyślnie 30 dni. Możesz usunąć go natychmiast z poziomu raportu."]],
    articlesEyebrow: "WIEDZA", articlesTitle: "Jak poprawić CV programisty", articlesCopy: "Trzy krótkie przewodniki o sygnałach, których szuka nasza analiza.",
    articles: [["Ownership", "Ownership w pracy: co oznacza i jak pokazać je w CV?", "dlaczego-ownership-jest-wazny-dla-pracodawcow"], ["Wpływ", "Obowiązki to nie rezultaty. Jak opisywać wpływ?", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"], ["Wiarygodność", "Jak budować wiarygodność techniczną w CV?", "wiarygodnosc-techniczna-w-cv"]],
    read: "Czytaj", finalTitle: "Sprawdź, co naprawdę komunikuje Twoje CV.", finalCopy: "Wynik wstępny jest bezpłatny. Cena pełnego raportu jest znana przed uploadem.",
    footerCopy: "Analiza CV oparta na dowodach z dokumentu.", footerLinks: ["Prywatność", "Regulamin", "Cookies", "Usuń dane", "Kontakt"],
    methodology: { label: "METODOLOGIA I ODPOWIEDZIALNOŚĆ", title: "Metoda ma właściciela i wersje.", copy: "Za metodę i produkt odpowiada Paweł Mączka-Czarnecki — Senior Frontend Developer z 15-letnim doświadczeniem w branży technologicznej, obejmującym prowadzenie zespołów i rozmów technicznych. Zasady analizy są jawne i wersjonowane.", link: "Zobacz, jak powstaje analiza" },
  },
  en: {
    nav: ["Difference", "Report", "Pricing", "FAQ"], navIds: ["difference", "report", "pricing", "faq"], switchLabel: "PL",
    title: <>Usually it&apos;s a few sentences missing,<br/><em>not more experience.</em></>,
    description: "Upload your CV and see for free the first impression it makes, what level it communicates, and one concrete thing to improve — pointed out with a quote from your own document. You only unlock the full report if you find the review valuable.",
    primary: "Check your CV for free", secondary: "View the sample report — 79/100",
    freeLine: "Free: ATS checker + first impression + 1 improvement with a quote",
    priceLine: `${formatPlanPrice("full_review", "en")} · full review + 2 rechecks`,
    trustLine: "We delete the source file after analysis. We never add facts that are not in the document.",
    specialty: "Start without an account or payment card. Criteria matched to your role and career stage.",
    synthetic: "Synthetic data · sample report", target: "TARGET", targetValue: "Senior Frontend Developer", level: "PERCEIVED LEVEL", levelValue: "Senior", first: "FIRST 20 SECONDS", overall: "Overall CV communication quality",
    interviewLabel: "INTERVIEW", simulationLabel: "SIMULATION", maybeLabel: "MAYBE",
    diagnosis: "An experienced Senior Frontend profile. Performance and architecture evidence is strongest in the earlier role; the latest role shows results and individual ownership less clearly.",
    scores: [["Frontend credibility", 86], ["Architecture", 82], ["Ownership and responsibility", 76]],
    atsEyebrow: "FREE ATS CHECKER", atsTitle: "The ATS checker is free. The real difference starts next.",
    ats: { title: "ATS checker", items: ["Can the system read the document?", "Are the sections and reading order clear?", "Is the format technically sound?"] },
    product: { title: brand.name, items: ["Is the most relevant experience visible?", "Are responsibility and impact clear?", "What will a person understand in the first 20 seconds?", "Which CV excerpt supports each finding?"] },
    agent: {
      eyebrow: "DIAGNOSIS BEFORE EDITING",
      title: "A revision plan you can also use with your AI.",
      subtitle: "Apply the recommendations yourself or copy the summary into your AI tool. It first checks your CV and asks only for necessary missing facts. It proposes edits after your answers or permission to reword existing content.",
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
    reportCopy: "Synthetic data · fictional candidate scoring 79/100. Even a strong CV gets concrete, actionable feedback — see the first impression, category scores, evidence and a fact-safe next step.",
    finding: { severity: "High impact", type: "Needs clarification", title: "Ownership of the migration is invisible", evidence: "“Worked on migrating checkout to Next.js with the Backend team.”", why: "It is unclear whether the candidate made decisions or delivered an assigned part.", action: "Add decision scope only after answering: which stage and trade-off did you personally own?" },
    findingEvidenceLabel: "EVIDENCE FROM THE CV", findingMattersLabel: "WHY IT MATTERS", findingActionLabel: "WHAT TO DO",
    openReport: "View the full sample report", noFacts: "This suggestion adds no new facts.",
    checksEyebrow: "RUBRIC", checksTitle: "What we review", checks: [["Experience", "Do the most important roles and projects create a clear picture of your specialism?"], ["Responsibility", "Are autonomy and decision scope visible?"], ["Impact", "Does the document show change, not only tasks?"], ["Credibility", "Does the stack have context, constraints and consequences?"], ["First impression", "What picture forms after 5, 10 and 20 seconds?"], ["ATS hygiene", "Is the document technically and structurally readable?"]],
    howEyebrow: "PROCESS", howTitle: "How the review works", how: [["1", "Upload your CV", "A text-based PDF or DOCX in English or Polish."], ["2", "See the initial result", "A verdict, first impression and one evidence-backed finding — free."], ["3", "Unlock the full report", "Only if the diagnosis is useful to you."]],
    promiseTitle: "We never invent experience", promiseCopy: "REWRITE only rephrases existing content. EXPOSE surfaces a hidden fact. GAP means there is no visible evidence. QUESTION tells you what we still need to learn from you.",
    pricingEyebrow: "PRICING", pricingTitle: "One decision. No subscription.",
    pricingLead: "You see the free initial result first. You only pay if you want to unlock the complete diagnosis.",
    priceCard: { plan: "full_review" as const, title: "Full review + 2 rechecks", copy: "Get your diagnosis, revise your CV and review it again twice within 30 days.", cta: "Start with the free result", items: ["the first 20 seconds and the most important risk", "responsibility, impact and technical credibility", "evidence, every issue and an ordered action plan", "2 rechecks of your revised CV within 30 days"] },
    priceAnchorTitle: "What you actually pay for when you fix a CV",
    priceAnchor: `A professional CV rewrite usually costs ${REWRITE_SERVICE_REFERENCE.en} and takes several days. The expensive part is not the writing. It is deciding what to change and why. That is exactly the part you get here, backed by evidence from your own CV. The rewriting you can do yourself, or with your own AI agent.`,
    oneTime: "One-time payment · no subscription", privateTitle: "Your CV does not stay with us", privateCopy: "We do not save your uploaded file. Your private report is available for 30 days and you can delete it sooner. CV and report content is never sent to analytics tools.",
    faqTitle: "Key questions", faq: [["What do I get for free?", "A short verdict, first impression, the most important issue and one specific piece of evidence."], ["Do you assess me as a professional?", "No. We only assess how experience is presented in the document."], ["Can my CV be in Polish?", "Yes. The review supports English and Polish CVs; scanned PDFs may be unreadable."], ["Do I need an account?", "No. Report access uses a private session and a secure link."], ["How long is the report stored?", "Thirty days by default. You can delete it immediately from the report."]],
    articlesEyebrow: "KNOWLEDGE", articlesTitle: "How to improve your developer CV", articlesCopy: "Three practical guides to the signals our review looks for.",
    articles: [["Ownership", "Ownership at work: what it means and how to show it on a CV", "why-ownership-matters-to-employers"], ["Impact", "Responsibilities are not outcomes. How do you show impact?", "responsibilities-are-not-outcomes"], ["Technical credibility", "How to build technical credibility in a developer CV", "technical-credibility-in-a-developer-cv"]],
    read: "Read", finalTitle: "See what your CV really communicates.", finalCopy: "The initial result is free. The full report price is clear before upload.",
    footerCopy: "A CV review grounded in evidence from the document.", footerLinks: ["Privacy", "Terms", "Cookies", "Delete data", "Contact"],
    methodology: { label: "METHODOLOGY AND ACCOUNTABILITY", title: "The method has an owner and versions.", copy: "The method and product are owned by Paweł Mączka-Czarnecki — a Senior Frontend Developer with 15 years in technology, including team leadership and technical interviews. The review rules are public and versioned.", link: "See how the review is produced" },
  },
} as const;

export function LandingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const featured = featuredArticles(locale === "pl" ? articles : articlesEn, locale);
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
      { "@type": "Service", "@id": serviceId, name: locale === "pl" ? "Analiza CV developera" : "Developer CV review", serviceType: "Evidence-based CV review", provider: { "@id": `${absoluteUrl("/")}#organization` }, areaServed: locale === "pl" ? { "@type": "Country", name: "Poland" } : "Worldwide", availableLanguage: ["Polish", "English"], offers: [{ "@type": "Offer", name: t.priceCard.title, price: String(PLAN_CATALOG[locale][t.priceCard.plan].amountMinor / 100), priceCurrency: PLAN_CATALOG[locale][t.priceCard.plan].currency, url: absoluteUrl(analysisPath(locale)), availability: "https://schema.org/InStock" }] },
    ],
  };
  return <main className="landing-page launch-landing product-landing">
    <JsonLd data={structuredData}/>
    <PricingObserver locale={locale} targetId={sectionIds[2]}/>
    <PublicHeader locale={locale} languageHref={switchPath} homePage/>

    <section className="launch-hero container"><div className="hero-copy"><span className="hero-audience">{locale === "pl" ? "Analiza CV dla osób w IT" : "CV reviews for people in tech"}</span><h1>{t.title}</h1><p>{locale === "pl" ? "Od pierwszej pracy po Seniora i Leada. Prześlij CV i bezpłatnie zobacz pierwsze wrażenie oraz konkretną rzecz do poprawy, wskazaną cytatem z Twojego dokumentu." : "From your first job to Senior and Lead roles. Upload your CV and see the first impression and a concrete improvement for free, backed by a quote from your document."}</p><div className="hero-actions"><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="hero">{t.primary}<ArrowIcon/></Link></div><p className="product-price-note">{locale === "pl" ? "Wynik wstępny bezpłatnie" : "Free initial result"} · {t.priceLine}</p><small className="launch-specialty">{t.specialty}</small></div>
      <div id="jak" className="hero-product-demo">
        <CvProductPreview locale={locale} animated/>
        <nav className="hero-example-links" aria-label={locale === "pl" ? "Zobacz przykłady" : "Explore examples"}>
          <Link href={reportUrl}><FileText aria-hidden="true"/><span>{locale === "pl" ? "Przykładowy raport" : "Sample report"}<small>{locale === "pl" ? "Senior Frontend · 79/100" : "Senior Frontend · 79/100"}</small></span><ArrowIcon/></Link>
          <Link href={cvStoryPath(locale)} prefetch={false}><TrendingUp aria-hidden="true"/><span>{locale === "pl" ? "Historia poprawy CV" : "CV improvement story"}<small>{locale === "pl" ? "Pierwsza praca · 40 → 81/100" : "First job · 40 → 81/100"}</small></span><ArrowIcon/></Link>
        </nav>
      </div>
    </section>

    <CvReviewOverview locale={locale}/>

    <section id={sectionIds[0]} className="ats-section"><div className="container"><header className="launch-section-head"><h2>{t.atsTitle}</h2></header><MarketingReveal className="ats-compare"><article><FileCheck2 className="product-section-icon" aria-hidden="true"/><h3>{t.ats.title}</h3><ul>{t.ats.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul></article><article className="product-compare"><ScanText className="product-section-icon" aria-hidden="true"/><h3>{t.product.title}</h3><ul>{t.product.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul></article></MarketingReveal></div></section>

    <section id={sectionIds[1]} className="product-report-section container">
      <header className="product-report-heading launch-section-head"><div><h2>{t.reportTitle}</h2><p>{locale === "pl" ? "Fikcyjna kandydatka · Senior Frontend · 79/100" : "Fictional candidate · Senior Frontend · 79/100"}</p></div><Link className="secondary-button" href={reportUrl}>{t.openReport}<ArrowIcon/></Link></header>
      <div className="product-report-window">
        <header><span className="product-window-dots" aria-hidden="true"><i/><i/><i/></span><span>{t.synthetic}</span></header>
        <div className="product-report-timeline"><h3>{t.secondsTitle}</h3><MarketingReveal className="seconds-cards">{t.seconds.map(([label, text], index) => <article key={label}><b>{["05", "10", "20"][index]}</b><h4>{label}</h4><p>{text}</p></article>)}</MarketingReveal></div>
        <div className="product-report-finding"><div><span>{t.findingEvidenceLabel}</span><blockquote>{t.finding.evidence}</blockquote><p>{t.finding.why}</p></div><article className="sample-finding"><header><span>{t.finding.severity}</span><b>{t.finding.type}</b></header><h3>{t.finding.title}</h3><div><small>{t.findingActionLabel}</small><p>{t.finding.action}</p></div><footer><CheckIcon/>{t.noFacts}</footer></article></div>
      </div>
      <Link className="cv-story-teaser" href={cvStoryPath(locale)} prefetch={false}><span><small>{locale === "pl" ? "Pierwsza praca w IT · historia poprawy" : "First job in tech · an improvement story"}</small><strong>{locale === "pl" ? "Natalia: od 40 do 81/100" : "Natalia: from 40 to 81/100"}</strong><span>{locale === "pl" ? "Dwie iteracje. Konkretne pytania, odpowiedzi i zmiany." : "Two revisions. Specific questions, answers and edits."}</span></span><ArrowIcon/></Link>
      <small className="launch-disclaimer">{t.disclaimer}</small>
    </section>

    <section className="sales-revision-summary container"><NotebookPen aria-hidden="true"/><div><h2>{t.agent.title}</h2><p>{t.agent.subtitle}</p><small><ShieldCheck aria-hidden="true"/>{t.promiseTitle}</small></div><Link className="secondary-button" href={methodologyPath(locale)}>{t.agent.link}<ArrowIcon/></Link></section>



    <section id={sectionIds[2]} className="launch-pricing container"><div className="launch-section-head"><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div><MarketingReveal className="product-pricing-cards"><article className="product-free-card"><header><h3>{locale === "pl" ? "Wynik wstępny" : "Initial result"}</h3><strong>{locale === "pl" ? "0 zł" : "Free"}</strong></header><p>{locale === "pl" ? "Zobacz, czy diagnoza jest dla Ciebie wartościowa." : "See whether the diagnosis is useful to you."}</p><ul>{(locale === "pl" ? ["ATS checker", "pierwsze wrażenie", "1 konkretna poprawka z cytatem"] : ["ATS checker", "first impression", "1 concrete improvement with a quote"]).map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul><Link className="secondary-button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="pricing_free">{t.primary}<ArrowIcon/></Link><small>{locale === "pl" ? "Bez konta i karty płatniczej" : "No account or payment card"}</small></article><article className="product-full-card"><header><h3>{t.priceCard.title}</h3><strong>{formatPlanPrice(t.priceCard.plan, locale)}</strong></header><p>{t.priceCard.copy}</p><ul>{t.priceCard.items.map((item) => <li key={item}><CheckIcon/>{item}</li>)}</ul><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement={`pricing_${t.priceCard.plan}`}>{t.priceCard.cta}<ArrowIcon/></Link><small>{t.oneTime}</small></article></MarketingReveal></section>
    <section className="methodology-proof container"><Image src="/images/optimized/pawel-maczka-czarnecki-138b56a27c41.webp" width={512} height={512} sizes="(max-width: 720px) 80px, 112px" alt={locale === "pl" ? "Paweł Mączka-Czarnecki, twórca CV Unfold" : "Paweł Mączka-Czarnecki, creator of CV Unfold"}/><div><h2>{t.methodology.title}</h2><p>{t.methodology.copy}</p><Link href={methodologyPath(locale)}>{t.methodology.link}<ArrowIcon/></Link></div></section>
    <section className="privacy-strip"><div className="container"><LockIcon/><div><h2>{t.privateTitle}</h2><p>{t.privateCopy}</p></div><Link href={legalPath(locale, "privacy")}>{t.footerLinks[0]}<ArrowIcon/></Link></div></section>
    <FaqSection id={sectionIds[3]} title={t.faqTitle} items={t.faq}/>
    <section className="launch-articles container"><div className="launch-section-head"><h2>{t.articlesTitle}</h2></div><MarketingReveal>{featured.map(article => <article key={article.slug}><span>{article.category}</span><h3><Link href={`${articlesPath(locale)}/${article.slug}`}>{article.title}</Link></h3><Link href={`${articlesPath(locale)}/${article.slug}`}>{t.read}<ArrowIcon/></Link></article>)}</MarketingReveal><Link className="all-articles" href={articlesPath(locale)}>{locale === "pl" ? "Wszystkie artykuły" : "All articles"}<ArrowIcon/></Link></section>

    <section className="final-cta"><div className="container"><div><h2>{t.finalTitle}</h2><p>{t.finalCopy}</p></div><Link className="button" href={analysisPath(locale)} data-analytics-event="hero_cta_clicked" data-analytics-placement="final">{t.primary}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer launch-footer container"><div><Logo locale={locale}/><p>{t.footerCopy}</p></div><nav><Link href={methodologyPath(locale)}>{locale === "pl" ? "Metodologia" : "Methodology"}</Link>{(["privacy", "terms", "cookies", "delete", "contact"] as const).map((page, index) => <Link key={page} href={legalPath(locale, page)}>{t.footerLinks[index]}</Link>)}<a href={schoolsPath(locale)}>{locale === "pl" ? "Dla szkół IT" : "For IT schools"}</a></nav><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
    <MobileStickyCta href={analysisPath(locale)} label={locale === "pl" ? "Sprawdź CV" : "Review my CV"} price={formatPlanPrice("full_review", locale)}/>
  </main>;
}
