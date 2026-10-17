import { MarketingReveal } from "@/components/marketing-reveal";
import type { Locale } from "@/lib/i18n";

const copy = {
  pl: {
    title: "Od jednego zdania do konkretnej poprawki.",
    lead: "Uwaga z raportu wskazuje brak. Pytanie pomaga go wyjaśnić. Do CV trafiają wyłącznie potwierdzone informacje.",
    labels: ["Fragment CV", "Najpierw pytanie", "Poprawka po odpowiedzi"],
    source: "Sklep internetowy. Projekt kursowy. React i CSS.",
    question: "Co zrobiłaś samodzielnie poza instrukcją kursu?",
    answerLabel: "Potwierdzona odpowiedź",
    answer: "Dodałam usuwanie produktów z koszyka, samodzielnie.",
    prefix: "Projekt kursowy w React.",
    edit: "Samodzielnie dodałam usuwanie produktów z koszyka.",
    note: "Fikcyjny przykład. Bez odpowiedzi nie dopisujemy tego faktu. Podsumowanie z raportu możesz wykorzystać we własnym AI.",
  },
  en: {
    title: "From one sentence to a concrete improvement.",
    lead: "The finding identifies a gap. A question helps clarify it. Only confirmed information goes into your CV.",
    labels: ["CV excerpt", "First, a question", "Edit after the answer"],
    source: "Online shop. Course project. React and CSS.",
    question: "What did you build independently beyond the course instructions?",
    answerLabel: "Confirmed answer",
    answer: "I added removing products from the cart on my own.",
    prefix: "React course project.",
    edit: "Independently added removing products from the cart.",
    note: "Fictional example. Without an answer, this fact is not added. You can use the report summary in your own AI tool.",
  },
} as const;

export function CvRevisionScene({ locale = "pl" }: { locale?: Locale }) {
  const t = copy[locale];
  return <section className="cv-revision-scene" aria-label={t.title}>
    <header><h2>{t.title}</h2><p>{t.lead}</p></header>
    <MarketingReveal className="revision-scene-steps">
      <article><h3><span>01</span>{t.labels[0]}</h3><blockquote>{t.source}</blockquote><div className="revision-paper-lines" aria-hidden="true"><i/><i/><i/></div></article>
      <article><h3><span>02</span>{t.labels[1]}</h3><blockquote>{t.question}</blockquote><div className="revision-confirmation"><small>{t.answerLabel}</small><p>{t.answer}</p></div></article>
      <article><h3><span>03</span>{t.labels[2]}</h3><blockquote>{t.prefix} <mark>{t.edit}</mark></blockquote><div className="revision-paper-lines" aria-hidden="true"><i/><i/></div></article>
    </MarketingReveal>
    <p className="revision-scene-note">{t.note}</p>
  </section>;
}
