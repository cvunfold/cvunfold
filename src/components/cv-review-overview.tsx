import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";

const copy = {
  pl: {
    title: "Analiza CV programisty online",
    intro: "Sprawdź CV po polsku lub angielsku, zanim wyślesz je na kolejną ofertę. CVUnfold analizuje sposób przedstawienia projektów, umiejętności i odpowiedzialności w tekstowym PDF lub DOCX. Bezpłatny wynik zawiera test czytelności ATS, pierwsze wrażenie i jedną poprawkę z cytatem. Pełna analiza i dwa ponowne sprawdzenia są płatne.",
    cards: [
      { label: "Pierwsza praca i Junior", title: "CV bez doświadczenia w IT", description: "Projekt z kursu lub studiów też daje materiał do CV. Pokaż własny wkład i działające funkcje, wybierając kontekst pierwszej pracy w analizie.", path: "/artykuly/cv-bez-doswiadczenia-w-it", link: "Zobacz, jak opisać projekty" },
      { label: "Mid, Senior i Lead", title: "CV z doświadczeniem komercyjnym", description: "Sprawdź, czy opis pokazuje Twoje decyzje, zakres odpowiedzialności i rezultaty. Zobacz przykładową diagnozę na fikcyjnym CV Senior Frontend Developera.", path: "/przykladowy-raport", link: "Przejrzyj przykładowy raport" },
      { label: "Bezpłatny test ATS", title: "Czy CV da się odczytać?", description: "Test sprawdza techniczną czytelność dokumentu. Wynik nie gwarantuje przejścia przez każdy ATS ani zaproszenia na rozmowę. Treść i jej dopasowanie do roli wymagają osobnej oceny.", path: "/artykuly/pierwsze-20-sekund-cv", link: "Poznaj zakres testu ATS" },
    ],
  },
  en: {
    title: "Software engineer CV and resume review",
    intro: "Check your English or Polish CV before your next application. CVUnfold reviews how a text-based PDF or DOCX presents your projects, skills and responsibilities. The free result includes an ATS readability check, a first impression and one improvement backed by a quote. The full review and two rechecks are paid.",
    cards: [
      { label: "First job and Junior", title: "A tech CV with no work experience", description: "Coursework and personal projects can give you useful evidence. Choose the first-job context and describe your contribution and working features.", path: "/en/articles/tech-cv-with-no-experience", link: "Learn how to describe projects" },
      { label: "Mid, Senior and Lead", title: "A CV with professional experience", description: "Make your decisions, responsibility and outcomes visible. Explore a sample review of a fictional Senior Frontend Developer CV.", path: "/en/sample-report", link: "Explore the sample report" },
      { label: "Free ATS check", title: "Can your document be read?", description: "The check examines technical readability. It does not guarantee acceptance by every ATS or an interview. Your content and fit for a role need a separate review.", path: "/en/articles/the-first-20-seconds-of-a-cv", link: "Understand the ATS check" },
    ],
  },
} as const;

export function CvReviewOverview({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const headingId = locale === "pl" ? "analiza-cv-programisty" : "software-engineer-cv-review";
  return <section className="launch-articles container" aria-labelledby={headingId}>
    <div className="launch-section-head"><h2 id={headingId}>{t.title}</h2><p>{t.intro}</p></div>
    <div>{t.cards.map((card) => <article key={card.title}>
      <span>{card.label}</span><h3>{card.title}</h3><p>{card.description}</p>
      <Link href={card.path}>{card.link}<ArrowIcon/></Link>
    </article>)}</div>
  </section>;
}
