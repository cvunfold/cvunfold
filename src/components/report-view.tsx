"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import type { AtsCheckId, AtsCheckResult, AtsCheckStatus } from "@/lib/ats-checker";
import type { Purchase } from "@/lib/data/store";
import type { Plan } from "@/lib/plans";
import { formatPlanPrice, REWRITE_SERVICE_REFERENCE } from "@/lib/plans";
import { careerContextLabels, parseCareerContext } from "@/lib/ai/career-context";
import { analysisPath, articlesPath, homePath, sampleReportPath, type Locale } from "@/lib/i18n";
import { trackAnalyticsEvent, trackPurchaseConversion } from "@/lib/analytics/client";
import type { PurchaseSurface } from "@/lib/analytics/events";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { buildRevisionBrief } from "@/lib/ai/report-brief";
import { normalizeIssueAction } from "@/lib/ai/issue-action";
import { DEFAULT_MEASUREMENT_CONTEXT, type MeasurementContext } from "@/lib/audience";

const ExpressWalletCheckout = dynamic(
  () => import("@/components/google-pay-checkout").then((module) => module.ExpressWalletCheckout),
  { ssr: false },
);

function RevisionBrief({ report, locale }: { report: CVReport; locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const text = buildRevisionBrief(report, locale);
  const pl = locale === "pl";
  return <section className="report-section revision-brief">
    <h2>{pl ? "Podsumowanie do poprawy CV" : "CV revision summary"}</h2>
    <p>{pl ? "Zalecenia możesz wykorzystać samodzielnie albo wkleić do własnego AI razem z CV. Kopiowanie niczego nie wysyła. Przed udostępnieniem CV usuń dane, których nie chcesz przekazywać." : "Use the recommendations yourself or paste them into your own AI together with your CV. Copying sends nothing. Remove any CV details you do not want to share before uploading it elsewhere."}</p>
    <details><summary>{pl ? "Pokaż podsumowanie" : "Show summary"}</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{text}</pre></details>
    <button type="button" className="button" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setStatus("copied"); }
      catch { setStatus("failed"); }
    }}>{pl ? "Skopiuj podsumowanie" : "Copy summary"}</button>
    <p role="status">{status === "copied" ? (pl ? "Podsumowanie skopiowane" : "Summary copied") : status === "failed" ? (pl ? "Kopiowanie się nie udało. Rozwiń podsumowanie i skopiuj tekst ręcznie." : "Copy failed. Expand the summary and copy the text manually.") : ""}</p>
  </section>;
}

type SampleProfile = { name: string; note: string; evidence: Record<string, string> };
type Props = {
  paid: boolean;
  testAccess?: boolean;
  testAccessForm?: ReactNode;
  plan?: Plan;
  purchase?: Purchase;
  data: CVReport | TeaserReport;
  mockMode: boolean;
  locale: Locale;
  expiresAt?: string;
  demo?: SampleProfile;
  measurementContext?: MeasurementContext;
};

const copy = {
  pl: {
    sample: "PRZYKŁADOWY RAPORT", yourReport: "Twój raport CV", sampleReport: "Przykładowy raport CV",
    perceivedLevel: "POSTRZEGANY POZIOM", first20: "PIERWSZE 20 SEKUND", overall: "OGÓLNA JAKOŚĆ KOMUNIKACJI CV",
    documentPerception: "PERCEPCJA DOKUMENTU", targetLevel: "Aplikuje na poziom", targetAuto: "Poziom wykrywany z treści CV", print: "Drukuj / zapisz PDF", copyLink: "Skopiuj bezpieczny link",
    delete: "Usuń raport", expires: "Raport wygasa", profile: "Jak dokument buduje Twój profil", signals: "Co buduje ten obraz",
    reservations: "Co budzi rezerwę", questions: "O co mogą zapytać", after: ["Po 5 sekundach", "Po 10 sekundach", "Po 20 sekundach"],
    simulated: "SYMULOWANY WYNIK", improve: { reached: "Co najbardziej wzmocniłoby ten wynik?", pending: "Co najbardziej mogłoby przesunąć wynik w stronę rozmowy?" },
    disclaimer: "To symulacja pierwszego wrażenia na podstawie samego dokumentu, a nie prawdziwa decyzja rekrutacyjna ani przewidywanie wyniku konkretnej rekrutacji.",
    categories: "Sygnały poziomu w kategoriach", featured: "Najważniejsze ustalenie darmowej analizy", problem: "DO POPRAWY",
    matters: "DLACZEGO TO WAŻNE", action: "CO ZROBIĆ", proposedRewrite: "PROPONOWANY ZAPIS", confidence: "Pewność", perceptionMarker: "Wrażenie", targetMarker: "Aplikujesz na",
    fullIssues: "Co osłabia odbiór — dowód przed opinią", strengths: "Mocne sygnały", nextSteps: "Plan działania",
    lockedTitle: "Pełna anatomia problemów jest w raporcie", lockedCopy: "Odblokuj wszystkie dowody, priorytety i bezpieczne sugestie bez dopisywania faktów.", lockedOutcome: "Przestajesz zgadywać, co jest nie tak z Twoim CV.",
    anchorTitle: "Za co naprawdę płaci się przy poprawianiu CV",
    anchor: `Przepisanie CV u specjalisty kosztuje zwykle ${REWRITE_SERVICE_REFERENCE.pl} i trwa kilka dni. Najdroższa część tej ceny to nie samo pisanie, tylko decyzja, co w dokumencie zmienić i dlaczego. Dokładnie tę część odblokowujesz poniżej, na dowodach z Twojego CV. Zdania przepiszesz potem sam albo swoim agentem AI.`,
    sampleLink: "Zobacz, jak wygląda pełny raport", sampleLinkAria: "Zobacz, jak wygląda pełny raport (otwiera się w nowej karcie)",
    unlock: "Odblokuj pełny raport", oneTime: "płatność jednorazowa · bez subskrypcji", paymentMethodsLabel: "Obsługiwane płatności", paymentMethods: ["Karta", "BLIK", "Apple Pay", "Google Pay"], feedback: "Czy analiza była trafna?",
    rating: "Ocena", accuracy: "Trafność", comment: "Komentarz", issueScope: "Czego dotyczy uwaga?", issueScopeAll: "Całego raportu", send: "Wyślij feedback", thanks: "Dziękujemy — ta informacja pomaga poprawiać kolejne wersje.", feedbackPrivacy: "Komentarz przechowamy do 90 dni bez identyfikatora raportu ani treści CV. Nie wpisuj w nim danych kontaktowych ani fragmentów CV.",
    accurate: ["Tak", "Częściowo", "Nie"], copied: "Link skopiowany", copyFailed: "Nie udało się skopiować linku.",
    deleteConfirm: "Usunąć raport i wszystkie powiązane dane? Tej operacji nie można cofnąć.", private: "Raport jest prywatny i nie jest indeksowany.",
    samplePrivate: "Dane syntetyczne · fikcyjna kandydatka", viewArticles: "Rozwiń diagnozę w artykułach", analyze: "Sprawdź swoje CV", backHome: "Wróć do strony głównej",
    mobileSummary: "Twój bezpłatny wynik", fullIncludes: "W pełnym raporcie",
    atsTitle: "ATS / higiena techniczna dokumentu", atsCaption: "Czy plik da się poprawnie odczytać i sparsować. To nie jest ocena treści ani poziomu.", atsShowAll: "Pokaż wszystkie kontrole", atsCollapse: "Zwiń kontrole", teaserFinding: "PRZYKŁADOWA POPRAWKA", teaserLocked: "Zobacz, gdzie to występuje, jak wpływa na odbiór i co zmienić.", teaserSidebar: "Pełny raport pokazuje, jak Twoje CV czyta rekruter — i co zmienić najpierw.",
  },
  en: {
    sample: "SAMPLE REPORT", yourReport: "Your CV report", sampleReport: "Sample CV report",
    perceivedLevel: "PERCEIVED LEVEL", first20: "FIRST 20 SECONDS", overall: "OVERALL CV COMMUNICATION QUALITY",
    documentPerception: "DOCUMENT PERCEPTION", targetLevel: "Applying for level", targetAuto: "Level inferred from the CV", print: "Print / save PDF", copyLink: "Copy secure link",
    delete: "Delete report", expires: "Report expires", profile: "How the document frames your profile", signals: "What supports this impression",
    reservations: "What creates doubt", questions: "What they may ask", after: ["After 5 seconds", "After 10 seconds", "After 20 seconds"],
    simulated: "SIMULATED OUTCOME", improve: { reached: "What would most strengthen this outcome?", pending: "What could most improve the outcome towards Interview?" },
    disclaimer: "This is a simulation of the first impression created by the document, not a real hiring decision or a prediction for a specific application.",
    categories: "Seniority signals by category", featured: "The most important finding from your free analysis", problem: "TO IMPROVE",
    matters: "WHY IT MATTERS", action: "WHAT TO DO", proposedRewrite: "SUGGESTED WORDING", confidence: "Confidence", perceptionMarker: "Impression", targetMarker: "Applying for",
    fullIssues: "What weakens the document — evidence before opinion", strengths: "Strong signals", nextSteps: "Action plan",
    lockedTitle: "The full anatomy of the issues is in your report", lockedCopy: "Unlock every evidence reference, priority and fact-safe suggestion.", lockedOutcome: "You stop guessing what is wrong with your CV.",
    anchorTitle: "What you actually pay for when you fix a CV",
    anchor: `A professional CV rewrite usually costs ${REWRITE_SERVICE_REFERENCE.en} and takes several days. The expensive part of that price is not the writing. It is deciding what to change and why. That is exactly what you unlock below, backed by evidence from your own CV. The rewriting you can do yourself, or with your own AI agent.`,
    sampleLink: "See what the full report looks like", sampleLinkAria: "See what the full report looks like (opens in a new tab)",
    unlock: "Unlock the full report", oneTime: "one-time payment · no subscription", paymentMethodsLabel: "Supported payments", paymentMethods: ["Cards", "Apple Pay", "Google Pay"], feedback: "Was the analysis accurate?",
    rating: "Rating", accuracy: "Accuracy", comment: "Comment", issueScope: "What is this about?", issueScopeAll: "The whole report", send: "Send feedback", thanks: "Thank you — this helps us improve the next version.", feedbackPrivacy: "We retain your comment for up to 90 days without a report identifier or CV content. Please do not include contact details or CV excerpts.",
    accurate: ["Yes", "Partly", "No"], copied: "Link copied", copyFailed: "We could not copy the link.",
    deleteConfirm: "Delete the report and all related data? This cannot be undone.", private: "This report is private and not indexed.",
    samplePrivate: "Synthetic data · fictional candidate", viewArticles: "Explore the diagnosis in our articles", analyze: "Review your CV", backHome: "Back to homepage",
    mobileSummary: "Your free result", fullIncludes: "In the full report",
    atsTitle: "ATS / technical document hygiene", atsCaption: "Whether the file parses correctly. This is not an assessment of content or seniority.", atsShowAll: "Show all checks", atsCollapse: "Collapse checks", teaserFinding: "SAMPLE IMPROVEMENT", teaserLocked: "See where it appears, how it affects the reader and what to change.", teaserSidebar: "The full report shows how a recruiter reads your CV — and what to change first.",
  },
} as const;

// One deterministic finding per check (@/lib/ats-checker), not model output, so
// the copy is fixed here rather than coming back with the report.
const ATS_CHECK_COPY: Record<Locale, Record<AtsCheckId, Record<Exclude<AtsCheckStatus, "not_applicable">, { title: string; caption: string }>>> = {
  pl: {
    text_layer: {
      pass: { title: "Dokument ma prawdziwą warstwę tekstową", caption: "Tekst da się poprawnie wyodrębnić z pliku, więc systemy ATS mogą go odczytać." },
      warning: { title: "Część stron może być zeskanowanym obrazem", caption: "Niektóre strony mają mało lub brak tekstu do wyodrębnienia." },
      fail: { title: "Dokument wygląda na zeskanowany obraz", caption: "Większość stron nie ma warstwy tekstowej, więc ATS prawdopodobnie nic nie odczyta." },
    },
    reading_order: {
      pass: { title: "Tekst wyciąga się w naturalnej kolejności", caption: "Kolejność odczytu odpowiada wizualnemu układowi dokumentu." },
      warning: { title: "Kolejność odczytu miejscami odbiega od układu", caption: "Część tekstu może pojawić się w nieoczekiwanym miejscu po wyodrębnieniu." },
      fail: { title: "Kolejność odczytu jest zaburzona", caption: "Tekst prawdopodobnie wyodrębni się w losowej kolejności, myląc systemy ATS." },
    },
    sections: {
      pass: { title: "Standardowe sekcje są rozpoznawalne", caption: "Doświadczenie, umiejętności i wykształcenie mają rozpoznawalne nagłówki." },
      warning: { title: "Część standardowych sekcji jest trudna do rozpoznania", caption: "Tylko część typowych nagłówków sekcji jest widoczna." },
      fail: { title: "Brak rozpoznawalnych standardowych sekcji", caption: "ATS może nie rozpoznać, gdzie zaczyna się doświadczenie, umiejętności czy wykształcenie." },
    },
    dates_titles: {
      pass: { title: "Stanowiska i daty są czytelne", caption: "Nazwy stanowisk i przedziały dat mają standardowy, rozpoznawalny zapis." },
      warning: { title: "Część stanowisk lub dat może być trudna do odczytania", caption: "Rozpoznano tylko część standardowych dat lub nazw stanowisk." },
      fail: { title: "Stanowiska i daty są trudne do odczytania", caption: "Nie znaleziono standardowych przedziałów dat ani nazw stanowisk." },
    },
    contact_info: {
      pass: { title: "Dane kontaktowe są parsowalne", caption: "Adres e-mail ma standardowy, rozpoznawalny format." },
      warning: { title: "Znaleziono tylko telefon, brak e-maila", caption: "ATS i rekruterzy zwykle oczekują też adresu e-mail." },
      fail: { title: "Nie znaleziono parsowalnych danych kontaktowych", caption: "Nie wykryto standardowego adresu e-mail ani numeru telefonu." },
    },
    layout_columns: {
      pass: { title: "Układ jednokolumnowy", caption: "Brak wykrytych kolumn ani tabel mogących rozbić kolejność tekstu." },
      warning: { title: "Wykryto układ wielokolumnowy", caption: "Kolumny lub tabele mogą sprawić, że ATS wymiesza tekst z różnych sekcji." },
      fail: { title: "Układ silnie utrudnia odczyt kolejności", caption: "Kolumny lub tabele prawdopodobnie rozbijają kolejność tekstu dla ATS." },
    },
    glyph_artifacts: {
      pass: { title: "Brak dziwnych znaków czy ikon zastępujących tekst", caption: "Nie wykryto artefaktów ekstrakcji ani znaków zastępczych." },
      warning: { title: "Wykryto pojedyncze nietypowe znaki", caption: "Może to być ikona czcionkowa zapisana jako niedrukowalny znak." },
      fail: { title: "Wykryto uszkodzone lub zastępcze znaki", caption: "Część tekstu mogła zamienić się w nieczytelne znaki podczas ekstrakcji." },
    },
    date_format: {
      pass: { title: "Zapis dat jest jednoznaczny", caption: "Daty używają formatu, który nie budzi wątpliwości interpretacyjnych." },
      warning: { title: "W dokumencie mieszają się różne formaty dat", caption: "Różne zapisy dat utrudniają automatyczne odczytanie chronologii." },
      fail: { title: "Część dat jest zapisana niejednoznacznie", caption: "Format dnia i miesiąca (np. 03/04/2021) można odczytać na dwa sposoby." },
    },
  },
  en: {
    text_layer: {
      pass: { title: "Real text layer detected", caption: "Text can be extracted from the file, so ATS systems can read it." },
      warning: { title: "Some pages may be scanned images", caption: "Some pages have little or no extractable text." },
      fail: { title: "Document looks like a scanned image", caption: "Most pages have no text layer, so an ATS will likely read nothing." },
    },
    reading_order: {
      pass: { title: "Text extracts in a natural order", caption: "Extraction order matches the document's visual layout." },
      warning: { title: "Reading order is slightly off in places", caption: "Some text may appear out of place once extracted." },
      fail: { title: "Reading order is scrambled", caption: "Text likely extracts in a jumbled order, confusing ATS systems." },
    },
    sections: {
      pass: { title: "Standard sections are recognizable", caption: "Experience, skills and education have recognizable headings." },
      warning: { title: "Some standard sections are hard to recognize", caption: "Only some typical section headings are visible." },
      fail: { title: "No recognizable standard sections", caption: "An ATS may not recognize where experience, skills or education begin." },
    },
    dates_titles: {
      pass: { title: "Job titles and dates are readable", caption: "Job titles and date ranges use a standard, recognizable format." },
      warning: { title: "Some titles or dates may be hard to parse", caption: "Only some standard dates or job titles were recognized." },
      fail: { title: "Job titles and dates are hard to parse", caption: "No standard date ranges or job titles were found." },
    },
    contact_info: {
      pass: { title: "Contact info is parsable", caption: "The email address is in a standard, recognizable format." },
      warning: { title: "Only a phone number was found, no email", caption: "ATS systems and recruiters usually expect an email address too." },
      fail: { title: "No parsable contact info found", caption: "No standard email address or phone number was detected." },
    },
    layout_columns: {
      pass: { title: "Single-column layout", caption: "No columns or tables detected that could break text order." },
      warning: { title: "Multi-column layout detected", caption: "Columns or tables may cause an ATS to interleave text from different sections." },
      fail: { title: "Layout severely disrupts reading order", caption: "Columns or tables likely break text order for an ATS." },
    },
    glyph_artifacts: {
      pass: { title: "No stray characters or icon glyphs", caption: "No extraction artifacts or replacement characters detected." },
      warning: { title: "A few unusual characters detected", caption: "This may be an icon-font glyph stored as a non-printable character." },
      fail: { title: "Corrupted or replacement characters detected", caption: "Some text may have turned into unreadable characters during extraction." },
    },
    date_format: {
      pass: { title: "Date notation is unambiguous", caption: "Dates use a format that leaves no room for misinterpretation." },
      warning: { title: "Multiple date formats are mixed", caption: "Mixed date formats make it harder to parse the timeline automatically." },
      fail: { title: "Some dates are notated ambiguously", caption: "A day/month format (e.g. 03/04/2021) can be read two different ways." },
    },
  },
};

const ATS_STATUS_CLASS: Record<Exclude<AtsCheckStatus, "not_applicable">, string> = { pass: "ats-positive", warning: "ats-warning", fail: "ats-error" };
// Warnings and failures are the actionable ones, so the collapsed preview leads
// with those instead of the first three checks in checker order.
const ATS_STATUS_PRIORITY: Record<Exclude<AtsCheckStatus, "not_applicable">, number> = { fail: 0, warning: 1, pass: 2 };
const ATS_PREVIEW_SIZE = 3;

/** Same panel in the free and paid report: deterministic document hygiene, not a subjective content judgement, so there is nothing to withhold behind the paywall. Collapsed by default everywhere so it never outweighs the first real insight. */
function AtsPanel({ ats, locale }: { ats?: AtsCheckResult; locale: Locale }) {
  const t = copy[locale];
  const [expanded, setExpanded] = useState(false);
  if (!ats) return null;
  const visibleChecks = ats.checks.filter((check): check is typeof check & { status: Exclude<AtsCheckStatus, "not_applicable"> } => check.status !== "not_applicable");
  const previewChecks = [...visibleChecks].sort((a, b) => ATS_STATUS_PRIORITY[a.status] - ATS_STATUS_PRIORITY[b.status]).slice(0, ATS_PREVIEW_SIZE);
  const canToggle = visibleChecks.length > previewChecks.length;
  const checksToShow = expanded ? visibleChecks : previewChecks;
  return <div className="ats-panel">
    <div><b>{t.atsTitle}</b><p>{t.atsCaption}</p></div>
    <div className="ats-score"><strong>{ats.score}<small>/100</small></strong><i><span style={{ width: `${ats.score}%` }}/></i></div>
    {checksToShow.length ? <ul className="ats-findings">{checksToShow.map((check) => {
      const checkCopy = ATS_CHECK_COPY[locale][check.id][check.status];
      return <li key={check.id} className={ATS_STATUS_CLASS[check.status]}><b>{checkCopy.title}</b><span>{checkCopy.caption}</span></li>;
    })}</ul> : null}
    {canToggle ? <button type="button" className="ats-toggle" onClick={() => setExpanded((value) => !value)}>{expanded ? t.atsCollapse : t.atsShowAll}</button> : null}
  </div>;
}

const seniorityLabel = (value: string, locale: Locale = "pl") => value === "first_job" ? (locale === "pl" ? "Pierwsza praca w IT" : "First job in tech") : value === "unclear" ? "?" : value[0].toUpperCase() + value.slice(1);
const senioritySteps = ["junior", "mid", "senior", "lead"] as const;
const decisionLabel = {
  pl: { interview: "DO ROZMOWY", maybe: "DO ROZWAŻENIA", reject: "RACZEJ NIE" },
  en: { interview: "INTERVIEW", maybe: "MAYBE", reject: "REJECT" },
} as const;
// Matches the free teaser's wording (severitySummary below) so the same issue
// is never called something different before payment than after it.
const severityLabel = {
  pl: { critical: "Kluczowy", important: "Istotny", minor: "Drobny" },
  en: { critical: "High impact", important: "Important", minor: "Minor" },
} as const;
// What kind of change each issue proposes — same reader-facing wording
// regardless of locale, instead of the raw schema enum ("gap", "question"…).
const suggestionTypeLabel = {
  pl: { rewrite: "Lepszy zapis", expose: "Do wyróżnienia", gap: "Brak dowodu", question: "Do doprecyzowania" },
  en: { rewrite: "Rewrite", expose: "Highlight", gap: "Missing evidence", question: "Needs clarification" },
} as const;
const primaryProfileRole = (perceivedRole: string, targetRole: string) => {
  const firstRole = perceivedRole.split(/\s*[\/|]\s*/)[0]?.trim() || targetRole;
  return firstRole.split(/\s+(?:specjaliz\w*|speciali[sz]\w*)/i)[0]?.trim() || targetRole;
};
const confidenceLabel = {
  pl: { low: "niska", medium: "średnia", high: "wysoka" },
  en: { low: "low", medium: "medium", high: "high" },
} as const;
const TEASER_VARIANT = "evidence_v1" as const;

// Leading with the count made the report priced per finding, and a strong CV scores
// a low count — so the best candidates read the weakest pitch. The severity line
// below still carries how serious this is, which is the part that should land.
function teaserTitle(locale: Locale) {
  if (locale === "en") return "Your CV has places that may be weakening how it is received.";
  return "W Twoim CV są miejsca, które mogą osłabiać jego odbiór.";
}

function polishLabel(count: number, forms: [string, string, string]) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (count === 1) return forms[0];
  if (lastTwoDigits < 12 || lastTwoDigits > 14) {
    if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
  }
  return forms[2];
}

function severitySummary(teaser: TeaserReport, locale: Locale) {
  if (locale === "en") {
    return [[teaser.severityCounts.critical, "high impact"], [teaser.severityCounts.important, "important"], [teaser.severityCounts.minor, "minor"]]
      .filter(([count]) => Number(count) > 0).map(([count, label]) => `${count} ${label}`).join(" · ");
  }
  const parts: Array<{ count: number; forms: [string, string, string] }> = [
    { count: teaser.severityCounts.critical, forms: ["kluczowy", "kluczowe", "kluczowych"] },
    { count: teaser.severityCounts.important, forms: ["istotny", "istotne", "istotnych"] },
    { count: teaser.severityCounts.minor, forms: ["drobny", "drobne", "drobnych"] },
  ];
  return parts.filter(({ count }) => count > 0).map(({ count, forms }) => `${count} ${polishLabel(count, forms)}`).join(" · ");
}

function evidenceLabel(count: number, locale: Locale) {
  if (locale === "en") return "EVIDENCE FROM THE CV";
  return count === 1 ? "DOWÓD Z CV" : "DOWODY Z CV";
}

// Counting the findings priced the report per unit, and the count shrinks as the CV
// gets better — the strongest candidates saw the weakest offer. Name the kinds of
// answer waiting behind the paywall instead, led by the one the teaser never shows.
function teaserOfferHighlights(locale: Locale) {
  if (locale === "en") return [
    "how a recruiter reads your CV after 5, 10 and 20 seconds",
    "what creates doubt, and what they may ask about it",
    "what to change first, and why",
  ];
  return [
    "jak rekruter czyta Twoje CV po 5, 10 i 20 sekundach",
    "co budzi rezerwę i o co mogą zapytać na rozmowie",
    "co zmienić najpierw i dlaczego",
  ];
}

const reportTopics = {
  pl: {
    ownership: ["Dlaczego ownership jest ważny", "dlaczego-ownership-jest-wazny-dla-pracodawcow"],
    impact: ["Jak opisywać wpływ", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"],
    credibility: ["Wiarygodność techniczna w CV", "wiarygodnosc-techniczna-w-cv"],
    clarity: ["ATS a pierwsze 20 sekund CV", "pierwsze-20-sekund-cv"],
    seniority: ["Jak pokazać seniority", "jak-pokazac-seniority-w-cv"],
  },
  en: {
    ownership: ["Why ownership matters", "why-ownership-matters-to-employers"],
    impact: ["How to show impact", "responsibilities-are-not-outcomes"],
    credibility: ["Technical credibility in a CV", "technical-credibility-in-a-developer-cv"],
    clarity: ["ATS and the first 20 seconds", "the-first-20-seconds-of-a-cv"],
    seniority: ["How to show seniority", "how-to-show-seniority-in-a-cv"],
  },
} as const;

export function ReportView({ paid, plan = "full_review", purchase, testAccess = false, testAccessForm, data: reportData, mockMode, locale, expiresAt, demo, measurementContext = DEFAULT_MEASUREMENT_CONTEXT }: Props) {
  const firstJob = "document" in reportData && (reportData.document.targetSeniority === "first_job" || parseCareerContext(reportData.document.careerContext) === "first_job");
  const earlyCareer = "document" in reportData && (reportData.document.targetSeniority === "first_job" || reportData.document.targetSeniority === "junior"
    || (reportData.document.targetSeniority === "auto" && reportData.document.perceivedSeniority === "junior")
    || (reportData.document.careerContext !== undefined && reportData.document.careerContext !== "standard"));
  const lowerCareer = earlyCareer || ("document" in reportData && (reportData.document.targetSeniority === "mid"
    || (reportData.document.targetSeniority === "auto" && reportData.document.perceivedSeniority === "mid")));
  const t = { ...copy[locale], ...(lowerCareer ? (locale === "pl" ? {
    perceivedLevel: "PROFIL Z CV", categories: earlyCareer ? "Podstawy i projekty widoczne w CV" : "Umiejętności i samodzielność widoczne w CV",
    profile: firstJob ? "Jak CV pokazuje przygotowanie do pierwszej roli" : earlyCareer ? "Jak CV pokazuje podstawy i praktykę" : "Jak CV pokazuje Twoje doświadczenie", targetLevel: "Cel aplikacji",
  } : {
    perceivedLevel: "CV PROFILE", categories: earlyCareer ? "Fundamentals and projects shown in the CV" : "Skills and independence shown in the CV",
    profile: firstJob ? "How the CV shows preparation for a first role" : earlyCareer ? "How the CV shows fundamentals and practice" : "How the CV presents your experience", targetLevel: "Application target",
  }) : {}) };
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkState, setLinkState] = useState<"idle" | "copied" | "error">("idle");
  const [mobileStickyVisible, setMobileStickyVisible] = useState(false);
  const reportRoot = useRef<HTMLElement>(null);
  const featuredIssue = useRef<HTMLElement>(null);
  const paywallCta = useRef<HTMLButtonElement>(null);
  const paywall = useRef<HTMLElement>(null);
  const trackedViews = useRef(new Set<string>());
  const trackedPurchaseViews = useRef(new Set<string>());
  const isFree = !paid && !demo;
  const full = paid ? reportData as CVReport : null;
  const targetSeniority = reportData && "document" in reportData ? reportData.document.targetSeniority : undefined;
  const teaser = !paid ? reportData as TeaserReport : null;
  const data = reportData as CVReport;
  const profileRole = "document" in reportData ? primaryProfileRole(data.document.perceivedRole, data.document.targetRole) : "";
  const price = formatPlanPrice(plan, locale);

  useEffect(() => {
    if (testAccess) return;
    const event = demo ? "sample_report_viewed" : paid ? "full_report_viewed" : "teaser_viewed";
    if (!trackedViews.current.has(event)) {
      trackedViews.current.add(event);
      trackAnalyticsEvent(event, { plan, locale, market: locale, ...(isFree ? { teaser_variant: TEASER_VARIANT } : {}), ...measurementContext });
    }
    if (paid && purchase) trackPurchaseConversion({ ...purchase, locale, market: locale, teaserVariant: TEASER_VARIANT, ...measurementContext });
  }, [demo, isFree, locale, measurementContext, paid, plan, purchase, testAccess]);

  useEffect(() => {
    if (paid || demo || !reportRoot.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        const purchaseSurface = element.dataset.purchaseSurface;
        const paymentMethod = element.dataset.paymentMethod;
        if (!purchaseSurface || !paymentMethod) continue;
        const key = `${purchaseSurface}:${paymentMethod}`;
        if (trackedPurchaseViews.current.has(key)) continue;
        trackedPurchaseViews.current.add(key);
        trackAnalyticsEvent("unlock_cta_viewed", {
          plan, locale, market: locale, purchase_surface: purchaseSurface, payment_method: paymentMethod, teaser_variant: TEASER_VARIANT, ...measurementContext,
        });
      }
    }, { threshold: .5 });
    const targets = reportRoot.current.querySelectorAll<HTMLElement>("[data-purchase-surface][data-payment-method]:not(.report-mobile-sticky-cta)");
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [demo, locale, measurementContext, paid, plan]);

  // The sticky action belongs to the middle of the teaser: from the moment the reader
  // reaches the finding until the paywall — which carries its own button — comes into view.
  // Scroll drives it directly; the teaser is short enough that intersection thresholds
  // alone left the window a few pixels wide.
  useEffect(() => {
    if (paid || demo || !featuredIssue.current || !paywallCta.current) return;
    const findingSection = featuredIssue.current;
    const paywallButton = paywallCta.current;
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const updateVisibility = () => {
      const finding = findingSection.getBoundingClientRect();
      const paywallAction = paywallButton.getBoundingClientRect();
      const readerAtFinding = finding.top < window.innerHeight * .6 && finding.bottom > 0;
      // Never stack two purchase buttons on one screen.
      const paywallActionOffScreen = paywallAction.top > window.innerHeight * .9;
      setMobileStickyVisible(mobileQuery.matches && readerAtFinding && paywallActionOffScreen);
    };
    mobileQuery.addEventListener("change", updateVisibility);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    updateVisibility();
    return () => {
      mobileQuery.removeEventListener("change", updateVisibility);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [demo, paid]);

  useEffect(() => {
    if (mobileStickyVisible) document.documentElement.dataset.mobileCtaVisible = "true";
    else delete document.documentElement.dataset.mobileCtaVisible;
    return () => { delete document.documentElement.dataset.mobileCtaVisible; };
  }, [mobileStickyVisible]);

  useEffect(() => {
    if (!mobileStickyVisible) return;
    const key = "mobile_sticky:standard";
    if (trackedPurchaseViews.current.has(key)) return;
    trackedPurchaseViews.current.add(key);
    trackAnalyticsEvent("unlock_cta_viewed", {
      plan, locale, market: locale, purchase_surface: "mobile_sticky", payment_method: "standard", teaser_variant: TEASER_VARIANT, ...measurementContext,
    });
  }, [locale, measurementContext, mobileStickyVisible, plan]);

  async function unlock(surface: PurchaseSurface) {
    if (busy) return;
    trackAnalyticsEvent("unlock_cta_clicked", {
      plan, locale, market: locale, purchase_surface: surface, payment_method: "standard", teaser_variant: TEASER_VARIANT, ...measurementContext,
    });
    setBusy(true);
    try {
      const response = await fetch("/api/report/checkout", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.url) {
        trackAnalyticsEvent("checkout_started", { plan, locale, market: locale, teaser_variant: TEASER_VARIANT, ...measurementContext });
        window.location.assign(result.url);
        return;
      }
      if (response.ok) { router.refresh(); window.location.reload(); return; }
    } catch {
      // The visible fallback below intentionally avoids exposing provider details.
    }
    window.alert(locale === "pl" ? "Nie udało się rozpocząć płatności. Spróbuj ponownie." : "We could not start checkout. Please try again.");
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t.deleteConfirm)) return;
    const response = await fetch("/api/report", { method: "DELETE" });
    if (response.ok) {
      trackAnalyticsEvent("delete_requested", { locale, market: locale, ...measurementContext });
      router.push(`${homePath(locale)}?deleted=1`);
    }
  }

  async function copySecureLink() {
    setLinkState("idle");
    const response = await fetch("/api/report/access-link", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) { setLinkState("error"); return; }
    try { await navigator.clipboard.writeText(result.url); setLinkState("copied"); }
    catch { setLinkState("error"); }
  }

  async function feedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/report/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: Number(form.get("rating")), accurate: form.get("accurate"), comment: form.get("comment"),
        ...(String(form.get("issueId") || "").trim() ? { issueId: String(form.get("issueId")).trim() } : {}) }),
    });
    if (response.ok) { setSent(true); trackAnalyticsEvent("feedback_submitted", { locale, market: locale, plan, ...measurementContext }); }
  }

  if (isFree) {
    return <main ref={reportRoot} className="report-page report-v2 report-free-teaser">
      <header className="report-mobile-header"><Logo locale={locale}/><Link href={homePath(locale)}>{locale === "pl" ? "Wróć" : "Back"}</Link></header>
      <div className="report-layout">
        <aside className="report-sidebar report-free-sidebar">
          <Logo locale={locale}/>
          <span className="overline">{t.mobileSummary}</span>
          <p className="verdict">{t.teaserSidebar}</p>
          <button onClick={() => void unlock("desktop_sidebar")} disabled={busy} className="button sidebar-buy" data-purchase-surface="desktop_sidebar" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button>
          <small className="safe-note"><LockIcon/> {t.private}</small>
        </aside>

        <div className="report-content">
          <header className="report-title">
            <div><h1>{t.mobileSummary}</h1><p>{locale === "pl" ? "Pełna diagnoza pozostaje prywatna do czasu odblokowania raportu." : "The full diagnosis stays private until you unlock the report."}</p></div>
            <div className="report-actions"><button className="delete-link" onClick={remove}><LockIcon/>{t.delete}</button></div>
          </header>
          {expiresAt ? <p className="report-expiry">{t.expires}: <time dateTime={expiresAt}>{new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", { dateStyle: "long" }).format(new Date(expiresAt))}</time></p> : null}

          {teaser ? <div className="report-mobile-offer">
            <span>{t.fullIncludes}</span>
            <ul>{teaserOfferHighlights(locale).map((item) => <li key={item}>{item}</li>)}</ul>
            <button onClick={() => void unlock("mobile_summary")} disabled={busy} className="button" data-purchase-surface="mobile_summary" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button>
            <small>{t.oneTime}</small>
          </div> : null}

          <section className="report-section teaser-profile">
            <span>{t.perceivedLevel}</span>
            <p>{teaser?.profileSummary}</p>
          </section>

          <section className="report-section teaser-first-impression">
            <span>{locale === "pl" ? "PIERWSZE WRAŻENIE PO 20 SEKUNDACH" : "FIRST IMPRESSION AFTER 20 SECONDS"}</span>
            <p>{teaser?.firstImpression}</p>
          </section>

          <AtsPanel ats={teaser?.ats} locale={locale}/>

          <section ref={featuredIssue} className="report-section teaser-featured-issue">
            <span>{t.teaserFinding}</span>
            <h2>{teaserTitle(locale)}</h2>
            {teaser ? <p className="teaser-severity">{severitySummary(teaser, locale)}</p> : null}
            {teaser?.featuredIssue ? <article className="teaser-finding">
              <div><small>{t.problem}</small><h3>{teaser.featuredIssue.title}</h3></div>
              <div><small>{teaser.featuredIssue.evidenceKind === "gap" ? (locale === "pl" ? "BRAK DOWODU W DOKUMENCIE" : "MISSING EVIDENCE IN THE DOCUMENT") : evidenceLabel(1, locale)}</small>{teaser.featuredIssue.evidenceKind === "gap" ? <p>{teaser.featuredIssue.evidence}</p> : <blockquote>{teaser.featuredIssue.evidence}</blockquote>}</div>
              <div><small>{locale === "pl" ? "JAK MOŻE TO ZOSTAĆ ODCZYTANE" : "HOW THIS MAY BE READ"}</small><p>{teaser.featuredIssue.interpretation}</p></div>
              <div><small>{locale === "pl" ? "KIERUNEK POPRAWY" : "DIRECTION FOR IMPROVEMENT"}</small><p>{teaser.featuredIssue.actionDirection}</p></div>
            </article> : <div className="teaser-lock"><LockIcon/><span>{locale === "pl" ? "Pełny raport zawiera diagnozy wraz z dowodami i priorytetami." : "The full report contains diagnoses with evidence and priorities."}</span></div>}
          </section>

          <section ref={paywall} className="locked"><LockIcon/><h2>{locale === "pl" ? "To była jedna poprawka. Pod spodem jest cała diagnoza." : "That was one improvement. The full diagnosis is below."}</h2><aside className="price-anchor"><b>{t.anchorTitle}</b><p>{t.anchor}</p></aside><p><b>{t.lockedOutcome}</b></p><ul className="locked-value"><li>{locale === "pl" ? "jak rekruter czyta Twoje CV po 5, 10 i 20 sekundach" : "how a recruiter reads your CV after 5, 10 and 20 seconds"}</li><li>{locale === "pl" ? "co budzi rezerwę i o co mogą zapytać na rozmowie" : "what creates doubt, and what they may ask about it"}</li><li>{locale === "pl" ? "uwagi z cytatem albo jasno nazwanym brakiem dowodu" : "findings with a quote or an explicit evidence gap"}</li><li>{locale === "pl" ? "kolejność: co zmienić najpierw i dlaczego" : "the order: what to change first, and why"}</li><li>{locale === "pl" ? "sugestie bez dopisywania faktów, których nie ma w CV" : "suggestions that never invent facts your CV does not have"}</li><li>{locale === "pl" ? "kryteria dopasowane do etapu kariery i mocne strony dokumentu" : "criteria tailored to your career stage and the document's strengths"}</li></ul><a className="locked-sample-link" href={sampleReportPath(locale)} target="_blank" rel="noopener noreferrer" aria-label={t.sampleLinkAria}>{t.sampleLink}<ArrowIcon/></a><div className="locked-payment-actions"><button ref={paywallCta} onClick={() => void unlock("report_paywall")} disabled={busy} className="button" data-purchase-surface="report_paywall" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button><ExpressWalletCheckout enabled={!mockMode} locale={locale} plan={plan} measurementContext={measurementContext} purchaseSurface="report_paywall" onAvailabilityChange={() => {}}/></div><div className="payment-methods-list" aria-label={t.paymentMethodsLabel}><span>{t.paymentMethodsLabel}</span><ul>{t.paymentMethods.map((method) => <li key={method}>{method}</li>)}</ul></div><small>{t.oneTime}</small>{testAccessForm}</section>
        </div>
      </div>
      <button className="report-mobile-sticky-cta" data-visible={mobileStickyVisible ? "true" : "false"} data-purchase-surface="mobile_sticky" data-payment-method="standard" aria-hidden={!mobileStickyVisible} tabIndex={mobileStickyVisible ? 0 : -1} disabled={busy} onClick={() => void unlock("mobile_sticky")}><span><LockIcon/>{busy ? "…" : t.unlock}</span><strong>{price}</strong></button>
      {mockMode ? <span className="dev-badge">DEV MOCK</span> : null}
    </main>;
  }

  const counts = paid && full
    ? { issues: full.issues.length, strengths: full.strengths.length, nextSteps: full.nextSteps.length }
    : { issues: 0, strengths: 0, nextSteps: 0 };
  const topicKeys = [...new Set([...(full?.issues.map((issue) => issue.category) || []), ...(lowerCareer ? ["clarity", "credibility"] : ["seniority", "ownership"])])]
    .filter((key): key is keyof typeof reportTopics.pl => key in reportTopics[locale] && (!lowerCareer || !["ownership", "seniority", "impact"].includes(key))).slice(0, 3);

  return <main ref={reportRoot} className={`report-page report-v2${demo ? " sample-report-page" : ""}`}>
    <header className="report-mobile-header"><Logo locale={locale}/><Link href={homePath(locale)}>{locale === "pl" ? "Wróć" : "Back"}</Link></header>
    <div className="report-layout">
      <aside className="report-sidebar">
        <Logo locale={locale}/>
        {lowerCareer ? <div className="career-focus"><strong>{earlyCareer ? (locale === "pl" ? "Podstawy, projekty i własny wkład" : "Fundamentals, projects and personal contribution") : (locale === "pl" ? "Umiejętności, decyzje i samodzielność" : "Skills, decisions and independence")}</strong><p>{targetSeniority !== "auto" ? `${t.targetLevel}: ${seniorityLabel(targetSeniority || "unclear", locale)}` : (locale === "pl" ? "Ocena dowodów widocznych w CV" : "Assessment of evidence shown in the CV")}</p></div> : <div className="seniority-track" aria-label={`${t.perceivedLevel}: ${seniorityLabel(data.document.perceivedSeniority)}${targetSeniority && targetSeniority !== "auto" ? `; ${t.targetLevel}: ${seniorityLabel(targetSeniority, locale)}` : ""}`}>
          <ol>{senioritySteps.map((level) => {
            const isPerceived = level === data.document.perceivedSeniority;
            const isTarget = targetSeniority !== "auto" && level === targetSeniority;
            return <li key={level} className={`${isPerceived ? "is-perceived " : ""}${isTarget ? "is-target" : ""}`}><b className="perception-marker">{isPerceived ? t.perceptionMarker : null}</b><i aria-hidden="true"/><strong>{seniorityLabel(level)}</strong><b className="target-marker">{isTarget ? t.targetMarker : null}</b></li>;
          })}</ol>{targetSeniority === "auto" ? <p className="seniority-auto">{t.targetAuto}</p> : null}
        </div>}
        <span className="overline">{t.first20}</span>
        <strong className={`sidebar-decision ${data.recruiterSimulation.simulatedDecision}`}>{decisionLabel[locale][data.recruiterSimulation.simulatedDecision]}</strong>
        <div className="secondary-score"><ScoreRing score={data.summary.overallScore} ariaLabel={locale === "pl" ? `Wynik ${data.summary.overallScore} na 100` : `Score ${data.summary.overallScore} out of 100`} locale={locale} captionBelow/><span>{t.overall}</span></div>
        <hr/>
        <p className="verdict">{data.summary.oneSentenceVerdict}</p>
        <ul className="report-includes"><li><span>{t.fullIssues}</span><b>{counts.issues}</b></li><li><span>{t.strengths}</span><b>{counts.strengths}</b></li><li><span>{t.nextSteps}</span><b>{counts.nextSteps}</b></li></ul>
        {demo ? <Link className="button sidebar-buy" href={analysisPath(locale)}>{t.analyze}</Link> : !paid ? <button onClick={() => void unlock("desktop_sidebar")} disabled={busy} className="button sidebar-buy" data-purchase-surface="desktop_sidebar" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button> : null}
        <small className="safe-note"><LockIcon/> {demo ? t.samplePrivate : t.private}</small>
      </aside>

      <div className="report-content">
        {demo ? <div className="sample-disclosure"><div><b>{t.sample}</b><small>{t.samplePrivate}</small></div><p>{demo.note}</p><Link className="sample-home-link" href={homePath(locale)}>{t.backHome}<ArrowIcon/></Link></div> : null}
        <header className="report-title">
          <div><h1>{demo ? t.sampleReport : t.yourReport}</h1><h2>{demo ? `${demo.name} · ` : ""}{profileRole}</h2><span>{t.documentPerception}</span><p>{locale === "pl" ? "Na podstawie treści i struktury CV. To nie jest ocena osoby." : "Based on the CV's content and structure. This is not an assessment of the person."}</p><p className="career-score-note">{locale === "pl" ? "Wynik opisuje jakość CV względem celu aplikacji." : "The score describes CV quality against the application target."}{data.document.careerContext && data.document.careerContext !== "standard" ? ` ${careerContextLabels[locale][parseCareerContext(data.document.careerContext) || "standard"]}.` : ""}</p></div>
          <div className="report-actions">
            {demo || paid ? <button className="report-download" onClick={() => window.print()}>{t.print}</button> : null}
            {!demo ? <button className="report-download" onClick={copySecureLink}>{linkState === "copied" ? t.copied : linkState === "error" ? t.copyFailed : t.copyLink}</button> : null}
            {!demo ? <button className="delete-link" onClick={remove}><LockIcon/>{t.delete}</button> : null}
          </div>
        </header>
        <section className="report-mobile-summary" aria-label={!paid && !demo ? t.mobileSummary : t.overall}>
          <div className="report-mobile-score"><ScoreRing score={data.summary.overallScore} ariaLabel={locale === "pl" ? `Wynik ${data.summary.overallScore} na 100` : `Score ${data.summary.overallScore} out of 100`} locale={locale} captionBelow/><span>{t.overall}</span></div>
            <div className="report-mobile-summary-copy">
            <span className="report-mobile-summary-title">{!paid && !demo ? t.mobileSummary : t.overall}</span>
            <div className="report-mobile-signals"><div><span>{t.perceivedLevel}</span><strong>{profileRole}</strong></div>{targetSeniority && targetSeniority !== "auto" ? <div><span>{t.targetLevel}</span><strong>{seniorityLabel(targetSeniority, locale)}</strong></div> : null}<div><span>{t.first20}</span><strong className={data.recruiterSimulation.simulatedDecision}>{decisionLabel[locale][data.recruiterSimulation.simulatedDecision]}</strong></div></div>
            <p className="verdict">{data.summary.oneSentenceVerdict}</p>
          </div>
        </section>
        {expiresAt ? <p className="report-expiry">{t.expires}: <time dateTime={expiresAt}>{new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", { dateStyle: "long" }).format(new Date(expiresAt))}</time></p> : null}

        <section className="report-section recruiter-perspective">
          <div className="section-heading"><span>01</span><h2>{t.profile}</h2></div>
          <div className="recruiter-profile"><div><span>{t.perceivedLevel}</span><p>{data.recruiterPerspective.profileSummary}</p></div><aside className={`seniority-alignment ${data.recruiterPerspective.seniorityAlignment}`}><strong>{lowerCareer ? t.targetLevel : seniorityLabel(data.document.perceivedSeniority)}</strong><p>{data.recruiterPerspective.seniorityAlignmentExplanation}</p></aside></div>
          {full ? <div className="recruiter-map"><div><h3>{t.signals}</h3>{full.recruiterPerspective.positiveSignals.map((signal) => <article key={signal.title}><CheckIcon/><div><b>{signal.title}</b><a href="#section:strengths">{locale === "pl" ? "Zobacz mocne sygnały" : "See strengths"}</a></div></article>)}</div><div><h3>{t.reservations}</h3>{full.recruiterPerspective.reservations.map((item) => <article key={item.title}><span aria-hidden="true">!</span><div><b>{item.title}</b>{item.issueId ? <a href={`#section:finding-${item.issueId}`}>{locale === "pl" ? "Zobacz uwagę i zalecenie" : "See finding and recommendation"}</a> : <p>{item.explanation}</p>}</div></article>)}</div><div><h3>{t.questions}</h3>{full.recruiterPerspective.likelyInterviewQuestions.map((item, index) => <article key={item.question}><span>{index + 1}</span><div><b>{item.question}</b><details><summary>{locale === "pl" ? "Dlaczego to pytanie?" : "Why this question?"}</summary><p>{item.whyThisQuestion}</p></details></div></article>)}</div></div> : null}
        </section>

        <section className="report-section timeline">
          <div className="section-heading"><span>02</span><h2>{t.first20}</h2></div>
          <div className="timeline-grid">{[data.recruiterSimulation.after5Seconds, data.recruiterSimulation.after10Seconds, data.recruiterSimulation.after20Seconds].map((text, index) => <article key={t.after[index]}><b>{index + 1}</b><div><h3>{t.after[index]}</h3><p>{text}</p></div></article>)}<div className={`decision ${data.recruiterSimulation.simulatedDecision}`}><span>{t.simulated}</span><strong>{decisionLabel[locale][data.recruiterSimulation.simulatedDecision]}</strong></div></div>
          <p className="disclaimer">{t.disclaimer}</p>{!full ? <div className="improve"><b>{data.recruiterSimulation.simulatedDecision === "interview" ? t.improve.reached : t.improve.pending}</b><ul>{data.recruiterSimulation.whatCouldImproveDecision.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
        </section>

        <section className="report-section">
          <div className="section-heading"><span>03</span><h2>{earlyCareer ? (locale === "pl" ? "Dowody przygotowania do roli" : "Evidence of preparation for the role") : t.categories}</h2></div>
          <div className="score-rows">{data.categoryScores.map((category) => <div key={category.key}><b>{category.label}</b><p>{category.rationale}</p><strong>{category.score}<small>/100</small></strong><i><span style={{ width: `${category.score}%` }}/></i></div>)}</div>
          <AtsPanel ats={data.ats} locale={locale}/>
        </section>

        {full ? <>
          <section className="report-section"><div className="section-heading"><span>04</span><h2>{t.fullIssues}</h2></div><div className="issues">{full.issues.map((issue, index) => {
            const hasEvidence = issue.suggestion?.type.toUpperCase() !== "GAP" && issue.evidenceRefs.length > 0;
            return <article id={`section:finding-${issue.id}`} key={issue.id}><header><span className={`severity ${issue.severity}`}>{severityLabel[locale][issue.severity]}</span><span>{issue.suggestion ? suggestionTypeLabel[locale][issue.suggestion.type] : ""}</span><b>{String(index + 1).padStart(2, "0")}</b></header><h3>{issue.title}</h3><div className="issue-grid"><div><small>{t.problem}</small><p>{issue.explanation}</p></div><div><small>{t.matters}</small><p>{issue.whyItMatters}</p></div><div><small>{t.action}</small><p>{normalizeIssueAction({ action: issue.action, suggestionType: issue.suggestion?.type, title: issue.title, locale, factualityNote: issue.suggestion?.factualityNote })}</p></div></div>{issue.suggestion?.proposed ? <div className="issue-proposed"><small>{t.proposedRewrite}</small><blockquote>{issue.suggestion.proposed}</blockquote></div> : null}{hasEvidence ? <div className="issue-evidence" data-evidence-count={Math.min(issue.evidenceRefs.length, 3)}><small>{evidenceLabel(issue.evidenceRefs.length, locale)}</small><div>{issue.evidenceRefs.map((ref) => <blockquote className="evidence-quote" key={ref}>{full.evidenceMap?.[ref] || (demo ? demo.evidence[ref] : null) || (locale === "pl" ? "Dowód niedostępny w starszej wersji raportu." : "Evidence unavailable in this legacy report.")}</blockquote>)}</div></div> : null}<footer>{t.confidence}: <b>{confidenceLabel[locale][issue.confidence]}</b> · {issue.suggestion?.factualityNote}</footer></article>;
          })}</div></section>
          <section id="section:strengths" className="report-section report-summary-grid"><div><h2>{t.strengths}</h2>{full.strengths.map((item) => <article key={item.id}><CheckIcon/><div><b>{item.title}</b><p>{item.explanation}</p></div></article>)}</div><div><h2>{t.nextSteps}</h2>{full.nextSteps.toSorted((a, b) => a.priority - b.priority).map((item) => <article key={item.priority}><span>{item.priority}</span><div><b>{item.title}</b>{item.issueId ? <a href={`#section:finding-${item.issueId}`}>{locale === "pl" ? "Zobacz szczegóły poprawki" : "See edit details"}</a> : <p>{item.action}</p>}</div></article>)}</div></section>
          <RevisionBrief report={full} locale={locale}/>
          {demo ? <section className="report-section sample-cta"><div><h2>{locale === "pl" ? "Co mówi Twoje CV?" : "What does your CV communicate?"}</h2><p>{locale === "pl" ? "Zobacz bezpłatny wynik i najważniejszy dowód." : "See your free result and most important evidence."}</p></div><Link className="button" href={analysisPath(locale)}>{t.analyze}<ArrowIcon/></Link></section> : <section className="report-section feedback"><h2>{t.feedback}</h2>{sent ? <p>{t.thanks}</p> : <form onSubmit={feedback}><label>{t.rating}<select name="rating" defaultValue="5">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>{t.accuracy}<select name="accurate" defaultValue="yes"><option value="yes">{t.accurate[0]}</option><option value="partly">{t.accurate[1]}</option><option value="no">{t.accurate[2]}</option></select></label>{full.issues.length ? <label>{t.issueScope}<select name="issueId" defaultValue=""><option value="">{t.issueScopeAll}</option>{full.issues.map((issue, index) => <option key={issue.id} value={issue.id}>{String(index + 1).padStart(2, "0")} · {issue.title}</option>)}</select></label> : null}<label>{t.comment}<textarea name="comment" maxLength={1000}/></label><small>{t.feedbackPrivacy}</small><button className="button">{t.send}</button></form>}</section>}
        </> : <section ref={paywall} className="locked"><LockIcon/><h2>{t.lockedTitle}</h2><p>{t.lockedCopy}</p><div className="locked-counts"><span>{counts.issues} {locale === "pl" ? "problemów" : "issues"}</span><span>{counts.strengths} {locale === "pl" ? "mocnych stron" : "strengths"}</span><span>{counts.nextSteps} {locale === "pl" ? "priorytetów" : "priorities"}</span></div><aside className="price-anchor"><b>{t.anchorTitle}</b><p>{t.anchor}</p></aside><div className="locked-payment-actions"><button ref={paywallCta} onClick={() => void unlock("report_paywall")} disabled={busy} className="button" data-purchase-surface="report_paywall" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button><ExpressWalletCheckout enabled={!mockMode} locale={locale} plan={plan} measurementContext={measurementContext} purchaseSurface="report_paywall" onAvailabilityChange={() => {}}/></div><div className="payment-methods-list" aria-label={t.paymentMethodsLabel}><span>{t.paymentMethodsLabel}</span><ul>{t.paymentMethods.map((method) => <li key={method}>{method}</li>)}</ul></div><small>{t.oneTime}</small>{testAccessForm}</section>}

        <nav className="report-knowledge"><span>{t.viewArticles}</span><div>{topicKeys.map((key) => { const [label, slug] = reportTopics[locale][key]; return <Link key={key} href={`${articlesPath(locale)}/${slug}`} target="_blank" rel="noopener noreferrer">{label}<ArrowIcon/></Link>; })}<Link href={articlesPath(locale)} target="_blank" rel="noopener noreferrer">{locale === "pl" ? "Wszystkie" : "All"}<ArrowIcon/></Link></div></nav>
      </div>
    </div>
    {mockMode ? <span className="dev-badge">DEV MOCK</span> : null}
  </main>;
}
