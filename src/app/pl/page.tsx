import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { articles } from "@/lib/content/articles";
import { ORGANIZATION_ID, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_LOCALE, SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Analiza CV oczami rekrutera — seniority, ownership i wpływ · CVUnfold" },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/pl",
    types: { "application/rss+xml": "/pl/artykuly/feed.xml" },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "/pl",
    siteName: SITE_NAME,
    title: "Analiza CV oczami rekrutera · CVUnfold",
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CVUnfold — analiza CV oczami rekrutera" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analiza CV oczami rekrutera · CVUnfold",
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", alt: "CVUnfold — analiza CV oczami rekrutera" }],
  },
};

const checks = [
  { title: "Wpływ i rezultaty", copy: "Czy pokazujesz efekty, a nie tylko obowiązki.", article: ["Jak opisywać wpływ", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"] },
  { title: "Ownership", copy: "Czy widać samodzielność i zakres decyzji.", article: ["Dlaczego ownership jest ważny", "dlaczego-ownership-jest-wazny-dla-pracodawcow"] },
  { title: "Techniczna wiarygodność", copy: "Czy technologie mają kontekst i uzasadnienie.", article: ["Jak budować wiarygodność", "wiarygodnosc-techniczna-w-cv"] },
  { title: "Architektura", copy: "Czy pokazujesz skalę, jakość i trade-offy." },
  { title: "Współpraca", copy: "Czy widać pracę z produktem i zespołem." },
  { title: "Jasność", copy: "Czy najważniejsze sygnały da się znaleźć szybko.", article: ["Jak działa pierwsze wrażenie", "pierwsze-20-sekund-cv"] },
];

const faq = [
  {
    question: "Jakie pliki mogę przesłać?",
    answer: "Tekstowy PDF lub DOCX do 8 MB. Dokument może być po polsku albo angielsku. Skanów i zdjęć CV nie odczytujemy w obecnej wersji.",
  },
  {
    question: "Ile trwa analiza CV?",
    answer: "Zwykle od kilkunastu do kilkudziesięciu sekund, zależnie od długości dokumentu i aktualnego obciążenia. W tym czasie nie zamykaj karty z analizą.",
  },
  {
    question: "Co otrzymuję bezpłatnie?",
    answer: "Zobaczysz ogólny wynik, odczytany profil i poziom seniority, symulację pierwszego wrażenia oraz największe ryzyko w dokumencie. Przed zakupem wiesz więc, czego dotyczy diagnoza.",
  },
  {
    question: "Co zawiera pełny raport?",
    answer: "Pełny raport rozwija wszystkie wykryte problemy, pokazuje dowody z CV, wyjaśnia ich znaczenie i układa poprawki według priorytetu. Otrzymujesz także mocne strony, ocenę czytelności dla ATS i konkretne następne kroki.",
  },
  {
    question: "Czy analiza ocenia mnie jako specjalistę?",
    answer: "Nie. CVUnfold ocenia wyłącznie sygnały widoczne w dokumencie. Słabszy wynik oznacza, że CV nie pokazuje części Twojej wartości — nie że jej nie masz.",
  },
  {
    question: "Czy sugestie dopisują fakty?",
    answer: "Nie. Nie wymyślamy wyników, technologii ani zakresu odpowiedzialności. Jeśli ważnego faktu brakuje, raport oznaczy lukę i podpowie pytanie, na które warto odpowiedzieć podczas redakcji CV.",
  },
  {
    question: "Czy moje CV trafia do pracodawców?",
    answer: "Nie. CVUnfold jest narzędziem dla kandydatów, a nie systemem rekrutacyjnym. Nie udostępniamy CV pracodawcom i nie używamy go do podejmowania decyzji rekrutacyjnych.",
  },
  {
    question: "Jak długo przechowujecie dokument i raport?",
    answer: "Plik źródłowy usuwamy po analizie. Raport jest dostępny przez prywatny link i domyślnie znika po 30 dniach; możesz też usunąć go wcześniej.",
  },
  {
    question: "Czy muszę zakładać konto?",
    answer: "Nie. Do przesłania CV i odebrania raportu nie potrzebujesz konta. Dostęp zachowujesz przez prywatny link do analizy.",
  },
  {
    question: "Czy CVUnfold jest kolejnym ATS checkerem?",
    answer: "Nie tylko. Sprawdzamy strukturę i czytelność dokumentu, ale przede wszystkim analizujemy, czy człowiek szybko zobaczy Twój poziom, wpływ, ownership i techniczną wiarygodność.",
  },
  {
    question: "Dla jakich stanowisk działa analiza?",
    answer: "Obecna wersja obsługuje role Frontend, Backend, Full-stack, Mobile, QA / Test Automation oraz DevOps / Platform — od Juniora do Leada. Każda specjalizacja ma własne akcenty oceny, dzięki czemu uwagi są konkretniejsze niż w uniwersalnym generatorze CV.",
  },
  {
    question: "Czy mogę dopasować CV do konkretnej oferty?",
    answer: "Tak. Wybierz analizę z opisem stanowiska, a raport rozróżni realnie brakującą umiejętność od umiejętności, której po prostu nie udowadniasz w CV.",
  },
];

const landingStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: "CV Unfold",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg"), width: 512, height: 512 },
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: absoluteUrl("/"),
      name: SITE_NAME,
      alternateName: "CV Unfold",
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: SITE_LANGUAGE,
    },
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/pl")}#webpage`,
      url: absoluteUrl("/pl"),
      name: "Analiza CV oczami rekrutera",
      description: SITE_DESCRIPTION,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": `${absoluteUrl("/pl")}#service` },
      inLanguage: SITE_LANGUAGE,
    },
    {
      "@type": "Service",
      "@id": `${absoluteUrl("/pl")}#service`,
      name: "Analiza CV oczami rekrutera",
      serviceType: "Analiza CV wspierana przez AI",
      description: SITE_DESCRIPTION,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: { "@type": "Country", name: "Polska" },
      availableLanguage: { "@type": "Language", name: "Polski", alternateName: "pl" },
      offers: [
        { "@type": "Offer", name: "Pełna analiza CV", price: "29", priceCurrency: "PLN", url: absoluteUrl("/pl/analiza"), availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Analiza CV z dopasowaniem do oferty", price: "39", priceCurrency: "PLN", url: absoluteUrl("/pl/analiza?job=1"), availability: "https://schema.org/InStock" },
      ],
    },
  ],
};

const aiCareerArticleSlug = "jak-nie-dac-sie-zastapic-przez-ai";
const featuredArticles = articles.filter((article) => article.slug !== aiCareerArticleSlug).slice(0, 3);

function NumberedSection({
  number,
  id,
  className = "",
  children,
}: {
  number: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <section id={id} className={`numbered-section ${className}`}>
    <div className="container numbered-inner">
      <span className="section-number" aria-hidden="true">{number}</span>
      <div className="section-body">{children}</div>
    </div>
  </section>;
}

export default function LandingPage() {
  return <main className="landing-page">
    <JsonLd data={landingStructuredData} />
    <header className="site-header container">
      <Logo />
      <nav aria-label="Główna nawigacja">
        <a href="#jak">Jak to działa</a>
        <a href="#sprawdzamy">Co sprawdzamy</a>
        <a href="#cennik">Cennik</a>
        <a href="#wiedza">Wiedza</a>
        <a href="#faq">FAQ</a>
      </nav>
      <Link className="button small" href="/pl/analiza" data-analytics-event="primary_cta_clicked" data-analytics-placement="header">Sprawdź CV <ArrowIcon /></Link>
    </header>

    <section className="hero container">
      <div className="hero-copy">
        <h1>Masz doświadczenie.<br />Czy widać je<br /><em>w Twoim CV?</em></h1>
        <span className="hero-rule" aria-hidden="true" />
        <p>Zobacz, jakie pierwsze wrażenie może zrobić Twoje CV na rekruterze lub hiring managerze. Otrzymaj konkretną, opartą na dowodach diagnozę.</p>
        <Link className="button" href="/pl/analiza" data-analytics-event="primary_cta_clicked" data-analytics-placement="hero">Sprawdź swoje CV <ArrowIcon /></Link>
        <div className="trust-line">
          <span><LockIcon /> Prywatnie</span>
          <span>Bez konta</span>
          <span>Bez wymyślania faktów</span>
        </div>
      </div>
      <div className="hero-report" aria-label="Podgląd raportu CVUnfold">
        <div className="paper">
          <div className="paper-head">TWOJE CV</div>
          <b>Jan Kowalski</b>
          <small>Frontend Developer</small>
          {[72, 92, 65, 84, 58, 76].map((width, index) => <i key={index} style={{ width: `${width}%` }} />)}
          <h4>DOŚWIADCZENIE</h4>
          {[90, 70, 80, 55].map((width, index) => <i key={`b${index}`} style={{ width: `${width}%` }} />)}
        </div>
        <div className="preview-analysis">
          <span>ANALIZA CVUNFOLD</span>
          <ScoreRing score={72} compact />
          <ul>
            <li>Wiarygodny profil techniczny</li>
            <li>Niejasny zakres ownershipu</li>
            <li>Za mało widocznych rezultatów</li>
          </ul>
          <Link className="report-preview-link" href="/pl/przykladowy-raport" data-analytics-event="demo_report_viewed" data-analytics-placement="hero_preview">Zobacz przykładowy raport <ArrowIcon /></Link>
        </div>
      </div>
    </section>

    <aside className="positioning-band" aria-labelledby="positioning-title">
      <div className="container positioning-grid">
        <div className="positioning-lead">
          <span>DOŚWIADCZENIE TO NIE WSZYSTKO</span>
          <h2 id="positioning-title">Twoje CV może zaniżać Twój poziom.</h2>
        </div>
        <div className="positioning-copy">
          <p>Nie dlatego, że brakuje Ci doświadczenia. Często dokument pokazuje zadania zamiast rezultatów, udział zamiast decyzji i technologie bez kontekstu. CVUnfold wskazuje, gdzie Twoja prawdziwa wartość ginie z pierwszego wrażenia.</p>
          <div className="positioning-shifts" aria-label="Przykłady zmiany perspektywy">
            <span><b>Zadania</b> → wpływ</span>
            <span><b>Udział</b> → ownership</span>
            <span><b>Stack</b> → wiarygodność</span>
          </div>
        </div>
      </div>
    </aside>

    <aside id="ai-i-kariera" className="career-ai" aria-labelledby="career-ai-title">
      <div className="container career-ai-grid">
        <div className="career-ai-copy">
          <h2 id="career-ai-title">Jak nie dać się zastąpić przez AI?</h2>
          <p>Nie próbuj wygrywać liczbą wykonanych zadań. Buduj profil oparty na rozumieniu problemu, osądzie, odpowiedzialności i wpływie — czyli wartości, której nie da się sprowadzić do samego outputu.</p>
          <Link className="button" href={`/pl/artykuly/${aiCareerArticleSlug}`}>Przeczytaj przewodnik <ArrowIcon /></Link>
        </div>
        <div className="career-ai-signals">
          <span className="career-ai-mark" aria-hidden="true">AI</span>
          <ol aria-label="Cztery filary odporniejszej kariery">
            <li><b>01</b><div><strong>Ownership problemu</strong><span>Odpowiadasz za kierunek i rezultat, nie tylko wykonanie.</span></div></li>
            <li><b>02</b><div><strong>Osąd i kontekst</strong><span>Rozumiesz ryzyko, ograniczenia i konsekwencje decyzji.</span></div></li>
            <li><b>03</b><div><strong>Wpływ na innych</strong><span>Tworzysz standardy i mechanizmy, które wzmacniają zespół.</span></div></li>
            <li><b>04</b><div><strong>AI pod kontrolą</strong><span>Przyspieszasz pracę, zachowując odpowiedzialność za jakość.</span></div></li>
          </ol>
        </div>
      </div>
    </aside>

    <NumberedSection number="01" className="seconds">
      <div className="section-intro">
        <h2>Pierwsze 20 sekund</h2>
        <p>Tyle często wystarcza, by powstało pierwsze wrażenie. Pokazujemy je krok po kroku — bez udawania prawdziwej decyzji rekrutacyjnej.</p>
        <Link className="check-topic-link" href="/pl/artykuly/pierwsze-20-sekund-cv">Przeczytaj, jak powstaje pierwsze wrażenie <ArrowIcon /></Link>
      </div>
      <ol className="seconds-list">
        <li><b>5 s</b><span>Co od razu przyciąga uwagę</span></li>
        <li><b>10 s</b><span>Jak interpretowane jest doświadczenie</span></li>
        <li><b>20 s</b><span>Jaki obraz kandydata powstaje</span></li>
      </ol>
    </NumberedSection>

    <NumberedSection number="02" id="sprawdzamy">
      <h2>Co naprawdę sprawdzamy</h2>
      <div className="check-grid">
        {checks.map(({ title, copy, article }) => <article key={title}><CheckIcon /><div><h3>{title}</h3><p>{copy}</p>{article?<Link className="check-topic-link" href={`/pl/artykuly/${article[1]}`}>{article[0]} <ArrowIcon /></Link>:null}</div></article>)}
      </div>
    </NumberedSection>

    <NumberedSection number="03" id="jak">
      <h2>Jak działa CVUnfold</h2>
      <ol className="steps">
        <li><b>01</b><h3>Prześlij CV</h3><p>Tekstowy PDF lub DOCX, po polsku albo angielsku.</p></li>
        <li><b>02</b><h3>Analizujemy dowody</h3><p>Maskujemy kontaktowe PII i szukamy konkretnych sygnałów.</p></li>
        <li><b>03</b><h3>Zobacz pierwsze wrażenie</h3><p>Wynik i największy problem otrzymujesz bezpłatnie.</p></li>
        <li><b>04</b><h3>Wdróż poprawki</h3><p>Pełny raport daje priorytety i bezpieczne sugestie.</p></li>
      </ol>
    </NumberedSection>

    <NumberedSection number="04" className="split">
      <div>
        <h2>To nie jest kolejny ATS checker</h2>
        <p>Nie sprawdzamy tylko, czy robot przeczyta dokument. Analizujemy, czy człowiek zrozumie Twój poziom, zakres odpowiedzialności i wartość, którą wnosisz.</p>
      </div>
      <ul className="line-list">
        <li><CheckIcon />Ocena nastawiona na człowieka, nie tylko algorytm</li>
        <li><CheckIcon />Każda ważna uwaga wskazuje dowód z CV</li>
        <li><CheckIcon />Wagi dopasowane do deklarowanego poziomu</li>
      </ul>
    </NumberedSection>

    <NumberedSection number="05" className="promise">
      <LockIcon />
      <div><h2>Nigdy nie wymyślamy Twojego doświadczenia</h2><p>Gdy brakuje faktu, pytamy o niego lub zostawiamy jawny placeholder. Nie dopiszemy liczb, technologii ani ownershipu, których nie ma w dokumencie.</p></div>
    </NumberedSection>

    <NumberedSection number="06" className="demo">
      <div>
        <h2>Zobacz prawdziwy format raportu</h2>
        <p>Pełny przykład dla fikcyjnej Senior Frontend Developerki: dokument źródłowy, pierwsze 20 sekund, wyniki kategorii, dowody, sugestie i kolejność poprawek.</p>
        <Link className="text-link" href="/pl/przykladowy-raport">Otwórz przykładowy raport <ArrowIcon /></Link>
      </div>
      <div className="demo-report-card">
        <header><div><small>DANE PRZYKŁADOWE</small><h3>Marta Nowak</h3><p>Senior Frontend Developer · 7 lat doświadczenia</p></div><ScoreRing score={81} compact /></header>
        <div className="demo-verdict"><span>WERDYKT</span><p>Dokument wiarygodnie komunikuje poziom Senior, ale traci część siły przez niejasny indywidualny wkład.</p></div>
        <div className="demo-finding"><div><span>NAJMOCNIEJSZY DOWÓD</span><p>„p75 LCP spadło z 3,1 s do 2,2 s, a współczynnik porzuceń mobilnych zmniejszył się o 8%.”</p></div><strong>82<small>/100</small></strong></div>
        <div className="demo-finding"><div><span>NAJWIĘKSZE RYZYKO</span><p>Niejasny zakres ownershipu przy design systemie używanym przez cztery zespoły.</p></div><b>CRITICAL</b></div>
        <Link className="report-preview-link" href="/pl/przykladowy-raport" data-analytics-event="demo_report_viewed" data-analytics-placement="sample_card">Zobacz 4 problemy i plan działania <ArrowIcon /></Link>
      </div>
    </NumberedSection>

    <NumberedSection number="07" id="cennik" className="pricing">
      <h2>Prosty cennik</h2>
      <div className="price-row">
        <article><span>Pełna analiza CV</span><strong>29 zł</strong><p>Wszystkie problemy, dowody, sugestie i plan działania.</p><Link className="button" href="/pl/analiza" data-analytics-event="primary_cta_clicked" data-analytics-placement="pricing_full">Wybieram <ArrowIcon /></Link></article>
        <article><span>Analiza CV + dopasowanie do oferty</span><strong>39 zł</strong><p>Pełna analiza oraz rozróżnienie brakującej umiejętności od brakującego dowodu.</p><Link className="button" href="/pl/analiza?job=1" data-analytics-event="primary_cta_clicked" data-analytics-placement="pricing_job_match">Wybieram <ArrowIcon /></Link></article>
      </div>
      <small>Płatność jednorazowa. Bez subskrypcji.</small>
    </NumberedSection>

    <NumberedSection number="08" className="privacy">
      <LockIcon />
      <div><h2>Twoje CV nie zostaje z nami</h2><p>Plik źródłowy usuwamy po analizie. Raport znika domyślnie po 30 dniach, a Ty możesz usunąć go natychmiast.</p></div>
    </NumberedSection>

    <NumberedSection number="09" id="wiedza" className="home-articles">
      <div className="home-articles-head">
        <div><h2>Zanim poprawisz CV</h2><p>Dowiedz się, jak pracodawcy odczytują ownership, seniority i wpływ — oraz jak pokazać je bez naciągania faktów.</p></div>
        <Link className="text-link" href="/pl/artykuly">Wszystkie artykuły <ArrowIcon /></Link>
      </div>
      <div className="home-article-list">{featuredArticles.map((article, index) => <article key={article.slug}>
        <span>{String(index + 1).padStart(2, "0")} · {article.category}</span>
        <h3><Link href={`/pl/artykuly/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <Link aria-label={`Czytaj: ${article.title}`} href={`/pl/artykuly/${article.slug}`}><ArrowIcon /></Link>
      </article>)}</div>
    </NumberedSection>

    <NumberedSection number="10" id="faq" className="faq">
      <div className="faq-head">
        <div><span>BEZ DROBNEGO DRUKU</span><h2>Najczęstsze pytania</h2></div>
        <p>Co dokładnie dostajesz, jak obchodzimy się z dokumentem i czego analiza świadomie nie robi.</p>
      </div>
      <div className="faq-grid">{faq.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </NumberedSection>

    <footer className="footer-shell">
      <div className="footer container"><Logo /><p>Merytoryczna analiza CV wspierana przez AI.</p><span>© {new Date().getFullYear()} CVUnfold</span></div>
    </footer>
    {process.env.MOCK_MODE === "true" ? <div className="dev-badge">DEV · MOCK MODE</div> : null}
  </main>;
}
