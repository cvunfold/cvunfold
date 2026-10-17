import Image from "next/image";
import { MessageCircle, FileText } from "lucide-react";
import { MarketingReveal } from "@/components/marketing-reveal";
import { CvFlowPreview } from "@/components/cv-flow-preview";
import type { Locale } from "@/lib/i18n";
import { formatPlanPrice } from "@/lib/plans";

const copy = {
  pl: {
    label: "Od fragmentu CV do pytania z raportu",
    role: "Frontend Developer",
    projects: "Projekty",
    project: "Sklep internetowy",
    course: "Projekt kursowy · React i CSS",
    excerpt: "Odtworzenie katalogu i koszyka według instrukcji kursu.",
    question: "Co zrobiłaś samodzielnie?",
    note: "Fikcyjny fragment CV",
  },
  en: {
    label: "From a CV excerpt to a question in the report",
    role: "Frontend Developer",
    projects: "Projects",
    project: "Online shop",
    course: "Course project · React and CSS",
    excerpt: "Recreated the catalogue and cart following course instructions.",
    question: "What did you build independently?",
    note: "Fictional CV excerpt",
  },
} as const;

export function CvProductPreview({ locale, compact = false, animated = false }: { locale: Locale; compact?: boolean; animated?: boolean }) {
  const t = copy[locale];
  const paper = <div className="cv-preview-paper">
    <header><div><strong>{animated ? "Natalia" : "Anna Kowalska"}</strong><span>{t.role}</span></div>{animated ? <Image className="cv-natalia-portrait" src="/images/optimized/natalia-682a57e80bca.webp" width={64} height={76} alt=""/> : <FileText aria-hidden="true"/>}</header>
    <div className="cv-preview-lines" aria-hidden="true"><i/><i/><i/></div>
    <div className="cv-preview-project"><small>{t.projects}</small><h3>{animated ? "LocalShelf" : t.project}</h3><p>{t.course}</p><mark>{animated ? (locale === "pl" ? "Praca przy komponentach i stylowaniu aplikacji." : "Worked on components and application styling.") : t.excerpt}</mark></div>
    <div className="cv-preview-lines" aria-hidden="true"><i/><i/></div>
  </div>;
  if (animated && !compact) return <CvFlowPreview locale={locale} price={formatPlanPrice("full_review", locale)}>{paper}</CvFlowPreview>;
  return <figure className={`cv-product-preview${compact ? " cv-product-preview-compact" : ""}`} aria-label={t.label}>
    <MarketingReveal className="cv-preview-scene">
      <div className="cv-preview-back" aria-hidden="true"/>
      {paper}
      <aside className="cv-preview-question"><MessageCircle aria-hidden="true"/><span>{t.question}</span></aside>
    </MarketingReveal>
    <figcaption>{t.note}</figcaption>
  </figure>;
}
