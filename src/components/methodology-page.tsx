import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Logo } from "@/components/logo";
import { PublicHeader } from "@/components/public-header";
import { brand } from "@/lib/brand";
import { analysisPath, articlesPath, homePath, methodologyPath, type Locale } from "@/lib/i18n";
import { absoluteUrl, AUTHOR_ID, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo";

const content = {
  pl: {
    pageTitle: "Jak powstaje analiza CV Unfold",
    description: "Poznaj metodologię CV Unfold: kryteria seniority, ownershipu i wpływu, kontrolę dowodów, bezpieczne wykorzystanie AI oraz osobę odpowiedzialną za produkt.",
    nav: { home: "Strona główna", report: "Przykładowy raport", articles: "Artykuły", cta: "Sprawdź CV", switch: "EN" },
    lead: "Model językowy jest częścią narzędzia, ale nie jest całą metodą. Analiza działa według stałych kryteriów, wymaga dowodów z dokumentu i nie może dopisywać doświadczenia, którego w CV nie ma.",
    authorLabel: "ZA PRODUKT ODPOWIADA",
    authorName: "Paweł Mączka-Czarnecki",
    authorRole: "Senior Frontend Developer · product-minded engineer · technical leader",
    authorIntro: "15 lat w branży technologicznej, w tym prowadzenie zespołów i rozmów technicznych. CV Unfold powstał z obserwacji, że wartościowe doświadczenie często znika za listą zadań i technologii.",
    whyTitle: "Dlaczego nie wystarczy wkleić CV do ChatGPT?",
    whyIntro: "ChatGPT może dać użyteczną opinię. Problemem nie jest brak inteligencji modelu, tylko brak powtarzalnego procesu i kontroli nad tym, co uznajemy za dowód.",
    genericTitle: "Ogólna rozmowa z chatbotem",
    generic: ["Wynik zależy od jakości pojedynczego promptu.", "Kryteria mogą zmieniać się pomiędzy odpowiedziami.", "Sugestia może brzmieć dobrze, choć nie wynika z dokumentu.", "Trudno porównać priorytety i odtworzyć sposób oceny."],
    productTitle: "Metoda CV Unfold",
    product: ["Rubryki zależne od roli i oczekiwanego seniority.", "Każda ważna diagnoza wskazuje istniejący fragment CV albo jawny brak dowodu.", "Stały schemat raportu oddziela problem, znaczenie, dowód i działanie.", "Walidacja pilnuje spójności wyniku, pewności i bezpiecznych sugestii."],
    honesty: "Nie twierdzimy, że stworzyliśmy własny model językowy ani że system odtwarza prawdziwą decyzję konkretnego rekrutera. Wartością CV Unfold jest przygotowany proces oceny i kontrola jakości nałożona na model AI.",
    processTitle: "Od dokumentu do raportu",
    process: [
      ["01", "Odczytujemy dokument", "Sprawdzamy typ i sygnaturę pliku, rozpoznajemy tekstowy PDF lub DOCX i odrzucamy dokumenty, których nie da się bezpiecznie odczytać."],
      ["02", "Rozpoznajemy kontekst", "Bierzemy pod uwagę wybraną specjalizację, poziom oraz — opcjonalnie — konkretną ofertę pracy."],
      ["03", "Szukamy sygnałów", "Oceniamy seniority, ownership, wpływ, techniczną wiarygodność, jasność przekazu i podstawową higienę ATS."],
      ["04", "Wymagamy dowodów", "Istotna uwaga musi odwoływać się do fragmentu CV. Brak informacji jest oznaczany jako luka lub pytanie, a nie domysł."],
      ["05", "Walidujemy raport", "Sprawdzamy strukturę, referencje do dowodów, poziomy pewności i deterministycznie obliczany wynik końcowy."],
    ],
    qualityTitle: "Jakość nie jest ustawiona raz na zawsze",
    qualityIntro: "Nie „dostrajamy modelu” w znaczeniu trenowania własnego AI. Rozwijamy i wersjonujemy cały system wokół niego: prompty, rubryki, walidację oraz sposób prezentowania diagnozy.",
    quality: [
      ["Powtarzalne evals PL/EN", "Kontrolowane scenariusze sprawdzają między innymi dowody, brak halucynacji, prompt injection, język raportu i rozróżnienie luki od braku kompetencji."],
      ["Wersje zamiast cichych zmian", "Zapisujemy wersję modelu, promptu i rubryki, aby wynik dało się powiązać z konkretną konfiguracją i porównać po zmianie."],
      ["Sygnały z działania produktu", "Monitorujemy kategorie błędów, skuteczność analiz, koszt oraz dobrowolny feedback — bez wysyłania treści CV i raportu do analytics."],
      ["Ręczna kontrola większych zmian", "Nowy model lub istotna zmiana kryteriów musi przejść ten sam zestaw testów oraz przegląd reprezentatywnych wyników."],
    ],
    guardrailsTitle: "Cztery bezpieczne rodzaje działania",
    guardrails: [
      ["REWRITE", "Przepisuje istniejącą informację bez dodawania faktów."],
      ["EXPOSE", "Lepiej eksponuje fakt, który już znajduje się w dokumencie."],
      ["GAP", "Wskazuje, że CV nie pokazuje dowodu ważnego dla roli."],
      ["QUESTION", "Prosi o informację potrzebną do bezpiecznej poprawki."],
    ],
    limitsTitle: "Co ta analiza może — i czego nie może",
    can: ["Pokazać, jaki poziom komunikuje dokument.", "Wskazać konkretne sygnały ownershipu i wpływu.", "Zasymulować pierwsze wrażenie tworzone przez samo CV.", "Ułożyć poprawki według znaczenia dla odbioru dokumentu."],
    cannot: ["Ocenić Twojej rzeczywistej wartości jako specjalisty.", "Przewidzieć wyniku konkretnej rekrutacji.", "Potwierdzić doświadczenia, których nie ma w dokumencie.", "Zastąpić rozmowy z rekruterem lub hiring managerem."],
    storyTitle: "Doświadczenie inżynierskie, nie anonimowy prompt",
    story: "Paweł pracował jako Frontend Developer, Senior Frontend Developer, Technical Lead i lider zespołu. Specjalizuje się w React, architekturze frontendu oraz jakości produktów cyfrowych. Prowadząc rozmowy techniczne, widział zarówno bardzo dobre doświadczenie opisane zbyt słabo, jak i efektowne deklaracje bez wystarczającego dowodu. Ta różnica jest punktem wyjścia metodologii CV Unfold.",
    independent: "CV Unfold jest niezależnym produktem Pawła i nie reprezentuje jego obecnych ani byłych pracodawców.",
    finalTitle: "Zobacz metodę na własnym dokumencie.",
    finalCopy: "Wynik wstępny jest bezpłatny. Pełny raport kupujesz dopiero po zobaczeniu konkretnej diagnozy.",
    privacy: "Dokument źródłowy nie jest przechowywany w storage produktu.",
  },
  en: {
    pageTitle: "How a CV Unfold review is produced",
    description: "Explore the CV Unfold methodology: seniority, ownership and impact criteria, evidence validation, responsible AI use and the person accountable for the product.",
    nav: { home: "Home", report: "Sample report", articles: "Articles", cta: "Review my CV", switch: "PL" },
    lead: "The language model is part of the tool, but it is not the whole method. Every review follows consistent criteria, requires evidence from the document and must not add experience that is not present in the CV.",
    authorLabel: "PRODUCT OWNER",
    authorName: "Paweł Mączka-Czarnecki",
    authorRole: "Senior Frontend Developer · product-minded engineer · technical leader",
    authorIntro: "Fifteen years in technology, including team leadership and technical interviews. CV Unfold grew from seeing valuable experience disappear behind lists of tasks and technologies.",
    whyTitle: "Why not simply paste your CV into ChatGPT?",
    whyIntro: "ChatGPT can provide useful feedback. The problem is not a lack of model intelligence, but the absence of a repeatable process and controls over what counts as evidence.",
    genericTitle: "A general chatbot conversation",
    generic: ["The result depends on the quality of a single prompt.", "Criteria may shift between responses.", "A suggestion may sound convincing without being supported by the document.", "It is difficult to compare priorities or reproduce the assessment."],
    productTitle: "The CV Unfold method",
    product: ["Rubrics tailored to the role and expected seniority.", "Every material finding points to an existing CV excerpt or an explicit evidence gap.", "A consistent report structure separates the issue, its impact, evidence and action.", "Validation checks score consistency, confidence and fact-safe suggestions."],
    honesty: "We do not claim to have created a proprietary language model or to reproduce a real decision made by a particular recruiter. CV Unfold's value lies in its review process and the quality controls placed around an AI model.",
    processTitle: "From document to report",
    process: [
      ["01", "Read the document", "We verify the file type and signature, extract text from a PDF or DOCX and reject documents that cannot be read safely."],
      ["02", "Recognise the context", "We account for the selected specialisation, level and — optionally — a specific job description."],
      ["03", "Find relevant signals", "We assess seniority, ownership, impact, technical credibility, clarity and basic ATS hygiene."],
      ["04", "Require evidence", "A material finding must reference the CV. Missing information becomes a gap or a question, never an assumption."],
      ["05", "Validate the report", "We check the schema, evidence references, confidence levels and a deterministically calculated final score."],
    ],
    qualityTitle: "Quality is not a one-off configuration",
    qualityIntro: "We do not ‘tune the model’ in the sense of training a proprietary AI. We continuously develop and version the system around it: prompts, rubrics, validation and the way findings are presented.",
    quality: [
      ["Repeatable PL/EN evals", "Controlled scenarios test evidence, factuality, prompt injection resistance, report language and the distinction between a gap and a missing skill."],
      ["Versions, not silent changes", "We record the model, prompt and rubric version so that a result can be tied to a specific configuration and compared after a change."],
      ["Product quality signals", "We monitor error categories, analysis success, cost and voluntary feedback — without sending CV or report content to analytics."],
      ["Human review for material changes", "A new model or material rubric change must pass the same tests and a review of representative outputs."],
    ],
    guardrailsTitle: "Four fact-safe action types",
    guardrails: [
      ["REWRITE", "Rephrases existing information without adding facts."],
      ["EXPOSE", "Surfaces a fact already present in the document."],
      ["GAP", "Marks evidence that is not visible for the target role."],
      ["QUESTION", "Requests information required for a safe improvement."],
    ],
    limitsTitle: "What the review can — and cannot — do",
    can: ["Show what level the document communicates.", "Identify concrete ownership and impact signals.", "Simulate the first impression created by the CV alone.", "Prioritise changes by their effect on how the document is read."],
    cannot: ["Assess your actual value as a professional.", "Predict the result of a particular recruitment process.", "Confirm experience that is not in the document.", "Replace a conversation with a recruiter or hiring manager."],
    storyTitle: "Engineering experience, not an anonymous prompt",
    story: "Paweł has worked as a Frontend Developer, Senior Frontend Developer, Technical Lead and team leader. He specialises in React, frontend architecture and digital product quality. While leading technical interviews, he saw both strong experience presented too weakly and impressive claims without sufficient evidence. That distinction is the starting point of the CV Unfold methodology.",
    independent: "CV Unfold is Paweł's independent product and does not represent any current or former employer.",
    finalTitle: "See the method applied to your document.",
    finalCopy: "The initial result is free. You only pay for the full report after seeing a specific diagnosis.",
    privacy: "The source document is not stored in product storage.",
  },
} as const;

export function MethodologyPage({ locale }: { locale: Locale }) {
  const t = content[locale];
  const en = locale === "en";
  const pageUrl = absoluteUrl(methodologyPath(locale));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": AUTHOR_ID, name: t.authorName, url: pageUrl, jobTitle: "Senior Frontend Developer", knowsAbout: ["Frontend engineering", "React", "Technical leadership", "Technical interviews", "CV review methodology"] },
      { "@type": "AboutPage", "@id": `${pageUrl}#webpage`, url: pageUrl, name: t.pageTitle, description: t.description, isPartOf: { "@id": WEBSITE_ID }, about: [{ "@id": AUTHOR_ID }, { "@id": ORGANIZATION_ID }], inLanguage: en ? "en" : "pl-PL" },
    ],
  };

  return <main className="methodology-page">
    <JsonLd data={structuredData}/>
    <PublicHeader locale={locale} languageHref={methodologyPath(en ? "pl" : "en")}/>

    <section className="methodology-hero container">
      <div className="methodology-hero-copy">
        <nav className="knowledge-breadcrumb" aria-label={en ? "Breadcrumb" : "Okruszki"}><Link href={homePath(locale)}>{t.nav.home}</Link><span>/</span><span>{en ? "Methodology" : "Metodologia"}</span></nav>
        <h1>{t.pageTitle}</h1>
        <p>{t.lead}</p>
      </div>
      <aside className="methodology-author-card">
        <Image src="/images/pawel-maczka-czarnecki.png" width={512} height={512} sizes="(max-width: 720px) 112px, 180px" alt={en ? "Paweł Mączka-Czarnecki, creator of CV Unfold" : "Paweł Mączka-Czarnecki, twórca CV Unfold"} priority/>
        <div><span>{t.authorLabel}</span><h2>{t.authorName}</h2><strong>{t.authorRole}</strong><p>{t.authorIntro}</p></div>
      </aside>
    </section>

    <section className="methodology-why">
      <div className="container">
        <header><h2>{t.whyTitle}</h2><p>{t.whyIntro}</p></header>
        <div className="methodology-compare">
          <article><h3>{t.genericTitle}</h3><ul>{t.generic.map((item)=><li key={item}>{item}</li>)}</ul></article>
          <article><h3>{t.productTitle}</h3><ul>{t.product.map((item)=><li key={item}><CheckIcon/>{item}</li>)}</ul></article>
        </div>
        <p className="methodology-honesty">{t.honesty}</p>
      </div>
    </section>

    <section className="methodology-process container">
      <header><span>01—05</span><h2>{t.processTitle}</h2></header>
      <ol>{t.process.map(([number, title, description])=><li key={number}><b>{number}</b><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
    </section>

    <section className="methodology-quality"><div className="container"><header><h2>{t.qualityTitle}</h2><p>{t.qualityIntro}</p></header><div>{t.quality.map(([title, description], index)=><article key={title}><span>{String(index + 1).padStart(2,"0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>

    <section className="methodology-guardrails">
      <div className="container"><header><LockIcon/><h2>{t.guardrailsTitle}</h2></header><div>{t.guardrails.map(([label, description])=><article key={label}><strong>{label}</strong><p>{description}</p></article>)}</div></div>
    </section>

    <section className="methodology-limits container">
      <h2>{t.limitsTitle}</h2>
      <div><article><span>{en ? "CAN" : "MOŻE"}</span><ul>{t.can.map((item)=><li key={item}><CheckIcon/>{item}</li>)}</ul></article><article><span>{en ? "CANNOT" : "NIE MOŻE"}</span><ul>{t.cannot.map((item)=><li key={item}>{item}</li>)}</ul></article></div>
    </section>

    <section className="methodology-story"><div className="container"><div className="methodology-story-mark" aria-hidden="true"><strong>15+</strong><span>{en ? "YEARS IN TECHNOLOGY" : "LAT W TECHNOLOGII"}</span></div><div><h2>{t.storyTitle}</h2><p>{t.story}</p><small>{t.independent}</small></div></div></section>
    <section className="final-cta"><div className="container"><div><h2>{t.finalTitle}</h2><p>{t.finalCopy}</p><small><LockIcon/>{t.privacy}</small></div><Link className="button" href={analysisPath(locale)}>{t.nav.cta}<ArrowIcon/></Link></div></section>
    <footer className="footer-shell"><div className="footer launch-footer container"><div><Logo locale={locale}/><p>{en ? "Evidence-based CV review for developers." : "Merytoryczna analiza CV dla developerów."}</p></div><nav><Link href={methodologyPath(locale)}>{en ? "Methodology" : "Metodologia"}</Link><Link href={articlesPath(locale)}>{t.nav.articles}</Link><Link href={homePath(locale)}>{t.nav.home}</Link></nav><span>© {new Date().getFullYear()} {brand.name}</span></div></footer>
  </main>;
}
