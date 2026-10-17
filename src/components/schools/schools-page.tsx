import Link from "next/link";
import Image from "next/image";
import { SchoolHeader } from "./school-header";
import { CvRevisionScene } from "@/components/cv-revision-scene";
import { SchoolPanelScene } from "@/components/schools/school-panel-scene";
import { SchoolContactForm } from "@/components/schools/school-contact-form";
import { SCHOOL_CONTACT_EMAIL } from "@/lib/schools/offer";
import { schoolContactDeliveryEnabled } from "@/lib/schools/contact-mail";
import { MarketingReveal } from "@/components/marketing-reveal";
import { Users, FileCheck2, Presentation, Monitor, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { homePath, legalPath, type Locale } from "@/lib/i18n";
import "@/app/dla-szkol/schools.css";
import "@/app/dla-szkol/offer.css";

const copy = {
  "pl": {
    "offer": "Oferta",
    "home": "Przejdź do CVUnfold",
    "panel": "Panel szkoły →",
    "eyebrow": "Dla opiekunów i mentorów szkół IT",
    "lead": "Dodaj CV kursantów, zobacz wspólne obszary do poprawy i przejdź do indywidualnych raportów. Przygotuj warsztat na podstawie tego, co naprawdę pokazują dokumenty.",
    "cta": "Porozmawiajmy o współpracy",
    "demo": "Zobacz demo bez logowania",
    "note": "Dla bootcampów, szkół programowania i mentorów przygotowujących kursantów do pierwszej pracy. Demo zawiera wyłącznie fikcyjne dane.",
    "features": "Możliwości panelu",
    "groupTitle": "Jedna grupa, wiele CV",
    "groupText": "Dodawaj dokumenty w paczkach i obserwuj status każdej analizy.",
    "reportTitle": "Raport z konkretnymi poprawkami",
    "reportText": "Od fragmentu dokumentu do wyjaśnienia problemu i następnego kroku.",
    "workshopTitle": "Wiedza do wykorzystania na zajęciach",
    "workshopText": "Zobacz wspólne trudności i wybierz, nad czym pracować z kursantami.",
    "process": "Od pierwszego spojrzenia do wspólnego warsztatu.",
    "step1": "Zobacz demo",
    "step1Text": "Sprawdź widok grupy i indywidualne raporty na fikcyjnych CV.",
    "step2": "Opowiedz o swojej szkole",
    "step2Text": "Podaj liczbę kursantów, rolę docelową i etap kariery. Dobierzemy wspólne kryteria dla grupy.",
    "step3": "Ustalmy sposób współpracy",
    "step3Text": "Przed rozpoczęciem ustalimy zakres, koszt i opiekunów, którym przyznamy dostęp do panelu.",
    "contactTitle": "Sprawdźmy, czy CVUnfold pasuje do Twojej szkoły.",
    "contactText": "Prowadzisz bootcamp albo kurs programowania? Napisz, jak pracujecie z CV kursantów. Porozmawiajmy o panelu i możliwościach współpracy.",
    "pilotTitle": "Zacznijmy od jednej grupy.",
    "pilotLead": "Sprawdź, czy raporty pomogą Twoim mentorom przygotować feedback i warsztat. Zakres pilotażu ustalimy przed dodaniem prawdziwych CV.",
    "pilotScopeTitle": "Co obejmuje pilotaż",
    "pilotScope": "Uzgodniona grupa kursantów, indywidualne raporty oraz podsumowanie wspólnych obszarów do pracy na zajęciach.",
    "pilotCostTitle": "Zakres i koszt przed startem",
    "pilotCost": "Pilotaż: 299 zł za jedną grupę do 30 kursantów. Obejmuje pełny raport i jedno ponowne sprawdzenie na osobę oraz dostęp przez 30 dni. Rozliczenie na podstawie faktury. Demo jest bezpłatne.",
    "pilotAccessTitle": "Dostęp dla opiekunów",
    "pilotAccess": "Po uzgodnieniu współpracy przyznajemy dostęp wskazanym opiekunom szkoły. Logowanie odbywa się linkiem na e-mail, bez hasła.",
    "pilotCta": "Zapytaj o pilotaż dla swojej grupy",
    "dataTitle": "Prawdziwe CV w prywatnym panelu.",
    "dataLead": "Publiczne demo zawiera wyłącznie fikcyjne dokumenty. Przed pilotażem ustalimy z Tobą zasady przekazania CV kursantów.",
    "dataAccessTitle": "Kto ma dostęp?",
    "dataAccess": "Panel sprawdza przynależność opiekuna do szkoły. Dokumenty przekazuje osoba uprawniona do ich przetwarzania; dane grupy są dostępne tylko opiekunom tej szkoły.",
    "dataRetentionTitle": "Przechowywanie i usuwanie",
    "dataRetention": "Przy analizie paczek w tle pliki trafiają do prywatnego magazynu tymczasowego. Usuwamy je po przetworzeniu, ze sprzątaniem najpóźniej po 24 godzinach. Raporty są dostępne do 30 dni. Uprawniony opiekun może wcześniej usunąć grupę wraz z jej raportami z panelu.",
    "privacy": "Zobacz politykę prywatności",
    "headline": "Lepsze CV.",
    "headlineEmphasis": "Cała grupa",
    "headlineEnd": "pod Twoją opieką."
  },
  "en": {
    "offer": "How it works",
    "home": "Go to CVUnfold",
    "panel": "School panel (Polish) →",
    "eyebrow": "For IT school coordinators and mentors",
    "lead": "Upload your students’ CVs, spot common areas for improvement and explore individual reports. Plan a workshop around what their documents actually show.",
    "cta": "Let’s talk about working together",
    "demo": "Explore the demo (Polish), no login needed",
    "note": "For bootcamps, coding schools and mentors helping students prepare for their first job. The demo uses fictional data only.",
    "features": "School panel features",
    "groupTitle": "One group, many CVs",
    "groupText": "Upload documents in batches and track each review’s progress.",
    "reportTitle": "Reports with actionable improvements",
    "reportText": "From a CV excerpt to an explanation of the issue and a clear next step.",
    "workshopTitle": "Insights for your next workshop",
    "workshopText": "Identify common challenges and decide what to work on with your students.",
    "process": "From a first look to a group workshop.",
    "step1": "Explore the demo",
    "step1Text": "Explore the group view and individual reports using fictional CVs. The demo is currently in Polish.",
    "step2": "Tell us about your school",
    "step2Text": "Tell us the group size, target role and career stage. We’ll agree on consistent review criteria for the group.",
    "step3": "Find the right way to work together",
    "step3Text": "Before we start, we’ll agree on scope, cost and the mentors who will receive panel access.",
    "contactTitle": "Let’s see if CVUnfold is a good fit for your school.",
    "contactText": "Run a bootcamp or coding course? Tell us how you work with your students’ CVs. Let’s discuss the panel and opportunities to work together.",
    "pilotTitle": "Let’s start with one group.",
    "pilotLead": "See whether the reports help your mentors prepare feedback and a workshop. We’ll agree on the pilot scope before you upload real CVs.",
    "pilotScopeTitle": "What the pilot includes",
    "pilotScope": "An agreed group of students, individual reports and a summary of common areas to work on in class.",
    "pilotCostTitle": "Scope and cost agreed upfront",
    "pilotCost": "Pilot: PLN 299 for one group of up to 30 students. Includes a full report and one recheck per student, with access for 30 days. Payment is by invoice. The demo is free.",
    "pilotAccessTitle": "Access for mentors",
    "pilotAccess": "Once we agree to work together, we grant access to your nominated school mentors. Sign in with an email link, without a password.",
    "pilotCta": "Ask about a pilot for your group",
    "dataTitle": "Real CVs belong in a private panel.",
    "dataLead": "The public demo contains fictional documents only. Before the pilot, we’ll agree with you on how to submit your students’ CVs.",
    "dataAccessTitle": "Who can access the data?",
    "dataAccess": "The panel verifies each mentor’s school membership. CVs must be submitted by someone authorised to process them; group data is available only to that school’s mentors.",
    "dataRetentionTitle": "Storage and deletion",
    "dataRetention": "Background batch analysis uses private temporary file storage. Files are deleted after processing, with scheduled cleanup after at most 24 hours. Reports are available for up to 30 days. An authorised mentor can delete a group and its reports earlier from the panel.",
    "privacy": "Read the privacy policy",
    "headline": "Better CVs.",
    "headlineEmphasis": "Your whole group",
    "headlineEnd": "in your care."
  }
} as const;

export function SchoolsPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <div className="school-shell school-home" lang={locale}>
    <SchoolHeader locale={locale}/>
    <main className="school-home-main">
      <section className="school-home-hero">
        <div className="school-home-intro"><span className="school-eyebrow">{t.eyebrow}</span><h1>{t.headline}<br/><em>{t.headlineEmphasis}</em> {t.headlineEnd}</h1><p>{t.lead}</p><div className="school-actions"><a className="button button-primary" href="#kontakt" data-analytics-event="school_contact_clicked" data-analytics-placement="hero">{t.cta}<ArrowRight aria-hidden="true"/></a><Link className="school-demo-link" href="/dla-szkol/demo" data-analytics-event="school_demo_clicked" data-analytics-placement="hero">{t.demo}</Link></div><p className="school-home-note">{t.note}</p></div>
        <SchoolPanelScene locale={locale}/>
      </section>
      <section className="school-home-features" aria-label={t.features}><article><Users aria-hidden="true"/><h2>{t.groupTitle}</h2><p>{t.groupText}</p></article><article><FileCheck2 aria-hidden="true"/><h2>{t.reportTitle}</h2><p>{t.reportText}</p></article><article><Presentation aria-hidden="true"/><h2>{t.workshopTitle}</h2><p>{t.workshopText}</p></article></section>
      <CvRevisionScene locale={locale}/>
      <section className="school-pilot" aria-labelledby="school-pilot-title">
        <span className="school-eyebrow">{locale === "pl" ? "PILOTAŻ DLA SZKOŁY" : "A PILOT FOR YOUR SCHOOL"}</span>
        <h2 id="school-pilot-title">{t.pilotTitle}</h2><p className="school-pilot-lead">{t.pilotLead}</p>
        <div className="school-pilot-cards">{[[t.pilotScopeTitle, t.pilotScope], [t.pilotCostTitle, t.pilotCost], [t.pilotAccessTitle, t.pilotAccess]].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
        <a className="button button-primary" href="#kontakt" data-analytics-event="school_contact_clicked" data-analytics-placement="pilot">{t.pilotCta}<ArrowRight aria-hidden="true"/></a>
      </section>
      <section className="school-data" aria-labelledby="school-data-title">
        <div><h2 id="school-data-title">{t.dataTitle}</h2><p>{t.dataLead}</p><Link href={legalPath(locale, "privacy")}>{t.privacy}</Link></div>
        <div>{[[t.dataAccessTitle, t.dataAccess], [t.dataRetentionTitle, t.dataRetention]].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section id="oferta" className="school-offer-process" aria-labelledby="school-process-title"><h2 id="school-process-title">{t.process}</h2><MarketingReveal className="school-offer-steps">{[
        { icon: Monitor, title: t.step1, text: t.step1Text },
        { icon: MessageCircle, title: t.step2, text: t.step2Text },
        { icon: Users, title: t.step3, text: t.step3Text },
      ].map(({ icon: Icon, title, text }, index) => <article key={title}><span>{index + 1}</span><Icon aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</MarketingReveal></section>
      <section id="kontakt" className="school-offer-contact" aria-labelledby="school-contact-title"><div><h2 id="school-contact-title">{t.contactTitle}</h2><p>{t.contactText}</p><a className="school-offer-email" href={`mailto:${SCHOOL_CONTACT_EMAIL}`} data-analytics-event="school_email_clicked" data-analytics-placement="contact"><Mail aria-hidden="true"/><span>{SCHOOL_CONTACT_EMAIL}</span></a><Image className="school-contact-illustration" src="/images/schools/contact-workshop-v1.webp" alt="" width={960} height={640} sizes="(max-width: 640px) 300px, (max-width: 900px) 360px, 480px"/></div><SchoolContactForm locale={locale} automaticDelivery={schoolContactDeliveryEnabled()}/></section>
      <footer className="school-home-footer"><Link href={homePath(locale)} prefetch={false}>{t.home} ↗</Link></footer>
    </main>
  </div>;
}
