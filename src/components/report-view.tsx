"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import type { Purchase } from "@/lib/data/store";
import type { Plan } from "@/lib/plans";
import { formatPlanPrice } from "@/lib/plans";
import { analysisPath, articlesPath, homePath, type Locale } from "@/lib/i18n";
import { trackAnalyticsEvent, trackPurchaseConversion } from "@/lib/analytics/client";
import type { PurchaseSurface } from "@/lib/analytics/events";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { normalizeIssueAction } from "@/lib/ai/issue-action";
import { DEFAULT_MEASUREMENT_CONTEXT, type MeasurementContext } from "@/lib/audience";

const ExpressWalletCheckout = dynamic(
  () => import("@/components/google-pay-checkout").then((module) => module.ExpressWalletCheckout),
  { ssr: false },
);

type SampleProfile = { name: string; note: string; evidence: Record<string, string> };
type Props = {
  paid: boolean;
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
    documentPerception: "PERCEPCJA DOKUMENTU", print: "Drukuj / zapisz PDF", copyLink: "Skopiuj bezpieczny link",
    delete: "Usuń raport", expires: "Raport wygasa", profile: "Jak dokument buduje Twój profil", signals: "Co buduje ten obraz",
    reservations: "Co budzi rezerwę", questions: "O co mogą zapytać", after: ["Po 5 sekundach", "Po 10 sekundach", "Po 20 sekundach"],
    simulated: "SYMULOWANY WYNIK", improve: "Co najbardziej mogłoby przesunąć wynik w stronę Interview?",
    disclaimer: "To symulacja pierwszego wrażenia na podstawie samego dokumentu, a nie prawdziwa decyzja rekrutacyjna ani przewidywanie wyniku konkretnej rekrutacji.",
    categories: "Sygnały poziomu w kategoriach", featured: "Najważniejsze ustalenie darmowej analizy", problem: "PROBLEM",
    evidence: "DOWÓD Z CV", matters: "DLACZEGO TO WAŻNE", action: "CO ZROBIĆ", confidence: "Pewność",
    fullIssues: "Co osłabia odbiór — dowód przed opinią", strengths: "Mocne sygnały", nextSteps: "Plan działania",
    lockedTitle: "Pełna anatomia problemów jest w raporcie", lockedCopy: "Odblokuj wszystkie dowody, priorytety i bezpieczne sugestie bez dopisywania faktów.",
    unlock: "Odblokuj pełny raport", oneTime: "płatność jednorazowa · bez subskrypcji", paymentMethodsLabel: "Obsługiwane płatności", paymentMethods: ["Karta", "BLIK", "Apple Pay", "Google Pay"], feedback: "Czy analiza była trafna?",
    rating: "Ocena", accuracy: "Trafność", comment: "Komentarz", send: "Wyślij feedback", thanks: "Dziękujemy — ta informacja pomaga poprawiać kolejne wersje.", feedbackPrivacy: "Komentarz zniknie razem z raportem. Zachowamy wyłącznie zbiorcze statystyki oceny bez identyfikatora analizy i treści dokumentu.",
    accurate: ["Tak", "Częściowo", "Nie"], copied: "Link skopiowany", copyFailed: "Nie udało się skopiować linku.",
    deleteConfirm: "Usunąć raport i wszystkie powiązane dane? Tej operacji nie można cofnąć.", private: "Raport jest prywatny i nie jest indeksowany.",
    samplePrivate: "Dane syntetyczne · fikcyjna kandydatka", viewArticles: "Rozwiń diagnozę w artykułach", analyze: "Sprawdź swoje CV", backHome: "Wróć do strony głównej",
    mobileSummary: "Twój bezpłatny wynik", fullIncludes: "Pełny raport zawiera",
    teaserFinding: "WYKRYTY PROBLEM", teaserLocked: "Zobacz, gdzie to występuje, jak wpływa na odbiór i co zmienić.", teaserSidebar: "Pełna diagnoza pokaże dowody, wpływ problemu i bezpieczne poprawki.",
  },
  en: {
    sample: "SAMPLE REPORT", yourReport: "Your CV report", sampleReport: "Sample CV report",
    perceivedLevel: "PERCEIVED LEVEL", first20: "FIRST 20 SECONDS", overall: "OVERALL CV COMMUNICATION QUALITY",
    documentPerception: "DOCUMENT PERCEPTION", print: "Print / save PDF", copyLink: "Copy secure link",
    delete: "Delete report", expires: "Report expires", profile: "How the document frames your profile", signals: "What supports this impression",
    reservations: "What creates doubt", questions: "What they may ask", after: ["After 5 seconds", "After 10 seconds", "After 20 seconds"],
    simulated: "SIMULATED OUTCOME", improve: "What could most improve the outcome towards Interview?",
    disclaimer: "This is a simulation of the first impression created by the document, not a real hiring decision or a prediction for a specific application.",
    categories: "Seniority signals by category", featured: "The most important finding from your free analysis", problem: "PROBLEM",
    evidence: "EVIDENCE FROM YOUR CV", matters: "WHY IT MATTERS", action: "WHAT TO DO", confidence: "Confidence",
    fullIssues: "What weakens the document — evidence before opinion", strengths: "Strong signals", nextSteps: "Action plan",
    lockedTitle: "The full anatomy of the issues is in your report", lockedCopy: "Unlock every evidence reference, priority and fact-safe suggestion.",
    unlock: "Unlock the full report", oneTime: "one-time payment · no subscription", paymentMethodsLabel: "Supported payments", paymentMethods: ["Cards", "Apple Pay", "Google Pay"], feedback: "Was the analysis accurate?",
    rating: "Rating", accuracy: "Accuracy", comment: "Comment", send: "Send feedback", thanks: "Thank you — this helps us improve the next version.", feedbackPrivacy: "The comment is deleted with the report. We retain only cumulative rating statistics without an analysis identifier or document content.",
    accurate: ["Yes", "Partly", "No"], copied: "Link copied", copyFailed: "We could not copy the link.",
    deleteConfirm: "Delete the report and all related data? This cannot be undone.", private: "This report is private and not indexed.",
    samplePrivate: "Synthetic data · fictional candidate", viewArticles: "Explore the diagnosis in our articles", analyze: "Review your CV", backHome: "Back to homepage",
    mobileSummary: "Your free result", fullIncludes: "The full report includes",
    teaserFinding: "DETECTED ISSUE", teaserLocked: "See where it appears, how it affects the reader and what to change.", teaserSidebar: "The full diagnosis shows the evidence, impact and fact-safe improvements.",
  },
} as const;

const seniorityLabel = (value: CVReport["document"]["perceivedSeniority"]) => value === "unclear" ? "—" : value[0].toUpperCase() + value.slice(1);
const decisionLabel = { interview: "INTERVIEW", maybe: "MAYBE", reject: "REJECT" } as const;
const confidenceLabel = {
  pl: { low: "niska", medium: "średnia", high: "wysoka" },
  en: { low: "low", medium: "medium", high: "high" },
} as const;

function teaserTitle(issueCount: number, locale: Locale) {
  if (locale === "en") return `We found ${issueCount} ${issueCount === 1 ? "issue" : "issues"} that may be weakening how your CV is received.`;
  if (issueCount === 1) return "Wykryliśmy 1 problem, który może osłabiać odbiór Twojego CV.";
  const lastTwoDigits = issueCount % 100;
  const lastDigit = issueCount % 10;
  const noun = lastTwoDigits >= 12 && lastTwoDigits <= 14 || lastDigit < 2 || lastDigit > 4 ? "problemów" : "problemy";
  return `Wykryliśmy ${issueCount} ${noun}, które mogą osłabiać odbiór Twojego CV.`;
}

const reportTopics = {
  pl: {
    ownership: ["Dlaczego ownership jest ważny", "dlaczego-ownership-jest-wazny-dla-pracodawcow"],
    impact: ["Jak opisywać wpływ", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"],
    credibility: ["Wiarygodność techniczna w CV", "wiarygodnosc-techniczna-w-cv"],
    clarity: ["Pierwsze 20 sekund CV", "pierwsze-20-sekund-cv"],
    seniority: ["Jak pokazać seniority", "jak-pokazac-seniority-w-cv"],
  },
  en: {
    ownership: ["Why ownership matters", "why-ownership-matters-to-employers"],
    impact: ["How to show impact", "responsibilities-are-not-outcomes"],
    credibility: ["Technical credibility in a CV", "technical-credibility-in-a-developer-cv"],
    clarity: ["The first 20 seconds", "the-first-20-seconds-of-a-cv"],
    seniority: ["How to show seniority", "how-to-show-seniority-in-a-cv"],
  },
} as const;

export function ReportView({ paid, plan = "full_review", purchase, data: reportData, mockMode, locale, expiresAt, demo, measurementContext = DEFAULT_MEASUREMENT_CONTEXT }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkState, setLinkState] = useState<"idle" | "copied" | "error">("idle");
  const [expressWalletAvailable, setExpressWalletAvailable] = useState(false);
  const [mobileStickyVisible, setMobileStickyVisible] = useState(false);
  const reportRoot = useRef<HTMLElement>(null);
  const mobileSummaryCta = useRef<HTMLButtonElement>(null);
  const paywall = useRef<HTMLElement>(null);
  const trackedViews = useRef(new Set<string>());
  const trackedPurchaseViews = useRef(new Set<string>());
  const isFree = !paid && !demo;
  const full = paid ? reportData as CVReport : null;
  const teaser = !paid ? reportData as TeaserReport : null;
  const data = reportData as CVReport;
  const price = formatPlanPrice(plan, locale);

  useEffect(() => {
    const event = demo ? "sample_report_viewed" : paid ? "full_report_viewed" : "teaser_viewed";
    if (!trackedViews.current.has(event)) {
      trackedViews.current.add(event);
      trackAnalyticsEvent(event, { plan, locale, market: locale, ...measurementContext });
    }
    if (paid && purchase) trackPurchaseConversion({ ...purchase, locale, market: locale, ...measurementContext });
  }, [demo, locale, measurementContext, paid, plan, purchase]);

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
          plan, locale, market: locale, purchase_surface: purchaseSurface, payment_method: paymentMethod, ...measurementContext,
        });
      }
    }, { threshold: .5 });
    const targets = reportRoot.current.querySelectorAll<HTMLElement>("[data-purchase-surface][data-payment-method]:not(.report-mobile-sticky-cta)");
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [demo, locale, measurementContext, paid, plan]);

  useEffect(() => {
    if (paid || demo || !mobileSummaryCta.current || !paywall.current || !("IntersectionObserver" in window)) return;
    const summaryAction = mobileSummaryCta.current;
    const paywallSection = paywall.current;
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const updateVisibility = () => {
      const summaryPassed = summaryAction.getBoundingClientRect().bottom <= 0;
      const beforePaywall = paywallSection.getBoundingClientRect().top > window.innerHeight;
      setMobileStickyVisible(mobileQuery.matches && summaryPassed && beforePaywall);
    };
    const observer = new IntersectionObserver(updateVisibility, { threshold: [0, .01] });
    observer.observe(summaryAction);
    observer.observe(paywallSection);
    mobileQuery.addEventListener("change", updateVisibility);
    window.addEventListener("resize", updateVisibility);
    updateVisibility();
    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", updateVisibility);
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
      plan, locale, market: locale, purchase_surface: "mobile_sticky", payment_method: "standard", ...measurementContext,
    });
  }, [locale, measurementContext, mobileStickyVisible, plan]);

  async function unlock(surface: PurchaseSurface) {
    if (busy) return;
    trackAnalyticsEvent("unlock_cta_clicked", {
      plan, locale, market: locale, purchase_surface: surface, payment_method: "standard", ...measurementContext,
    });
    setBusy(true);
    try {
      const response = await fetch("/api/report/checkout", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.url) {
        trackAnalyticsEvent("checkout_started", { plan, locale, market: locale, ...measurementContext });
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
      body: JSON.stringify({ rating: Number(form.get("rating")), accurate: form.get("accurate"), comment: form.get("comment") }),
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

          <section className="report-section teaser-profile">
            <span>{t.perceivedLevel}</span>
            <p>{teaser?.profileSummary}</p>
          </section>

          <section className="report-section teaser-hook">
            <span>{t.mobileSummary}</span>
            <h2>{teaserTitle(teaser?.issueCount || 0, locale)}</h2>
            {teaser?.findingTitle ? <div className="teaser-finding"><small>{t.teaserFinding}</small><h3>{teaser.findingTitle}</h3></div> : null}
            <p>{teaser?.hook}</p>
            <div><LockIcon/><span>{t.teaserLocked}</span></div>
          </section>

          <section ref={paywall} className="locked"><LockIcon/><h2>{t.lockedTitle}</h2><p>{t.lockedCopy}</p><div className={`locked-payment-actions${expressWalletAvailable ? " wallet-ready" : ""}`}><button onClick={() => void unlock("report_paywall")} disabled={busy} className="button" data-purchase-surface="report_paywall" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button><ExpressWalletCheckout enabled={!mockMode} locale={locale} plan={plan} measurementContext={measurementContext} purchaseSurface="report_paywall" onAvailabilityChange={setExpressWalletAvailable}/></div><div className="payment-methods-list" aria-label={t.paymentMethodsLabel}><span>{t.paymentMethodsLabel}</span><ul>{t.paymentMethods.map((method) => <li key={method}>{method}</li>)}</ul></div><small>{t.oneTime}</small></section>
        </div>
      </div>
      {mockMode ? <span className="dev-badge">DEV MOCK</span> : null}
    </main>;
  }

  const counts = paid && full
    ? { issues: full.issues.length, strengths: full.strengths.length, nextSteps: full.nextSteps.length }
    : { issues: 0, strengths: 0, nextSteps: 0 };
  const topicKeys = [...new Set([...(full?.issues.map((issue) => issue.category) || []), "seniority", "ownership"])]
    .filter((key): key is keyof typeof reportTopics.pl => key in reportTopics[locale]).slice(0, 3);

  return <main ref={reportRoot} className={`report-page report-v2${demo ? " sample-report-page" : ""}`}>
    <header className="report-mobile-header"><Logo locale={locale}/><Link href={homePath(locale)}>{locale === "pl" ? "Wróć" : "Back"}</Link></header>
    <div className="report-layout">
      <aside className="report-sidebar">
        <Logo locale={locale}/>
        <span className="overline">{t.perceivedLevel}</span>
        <strong className="perceived-level">{seniorityLabel(data.document.perceivedSeniority)}</strong>
        <span className="overline">{t.first20}</span>
        <strong className={`sidebar-decision ${data.recruiterSimulation.simulatedDecision}`}>{decisionLabel[data.recruiterSimulation.simulatedDecision]}</strong>
        <div className="secondary-score"><span>{t.overall}</span><ScoreRing score={data.summary.overallScore} ariaLabel={locale === "pl" ? `Wynik ${data.summary.overallScore} na 100` : `Score ${data.summary.overallScore} out of 100`} statusLabel={locale === "pl" ? "Dobry kierunek" : "Good direction"}/></div>
        <hr/>
        <p className="verdict">{data.summary.oneSentenceVerdict}</p>
        <ul className="report-includes"><li><span>{t.fullIssues}</span><b>{counts.issues}</b></li><li><span>{t.strengths}</span><b>{counts.strengths}</b></li><li><span>{t.nextSteps}</span><b>{counts.nextSteps}</b></li></ul>
        {demo ? <Link className="button sidebar-buy" href={analysisPath(locale)}>{t.analyze}</Link> : !paid ? <button onClick={() => void unlock("desktop_sidebar")} disabled={busy} className="button sidebar-buy" data-purchase-surface="desktop_sidebar" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button> : null}
        <small className="safe-note"><LockIcon/> {demo ? t.samplePrivate : t.private}</small>
      </aside>

      <div className="report-content">
        {demo ? <div className="sample-disclosure"><div><b>{t.sample}</b><small>{t.samplePrivate}</small></div><p>{demo.note}</p><Link className="sample-home-link" href={homePath(locale)}>{t.backHome}<ArrowIcon/></Link></div> : null}
        <header className="report-title">
          <div><h1>{demo ? t.sampleReport : t.yourReport}</h1><h2>{demo ? `${demo.name} · ` : ""}{data.document.perceivedRole} · {seniorityLabel(data.document.perceivedSeniority)}</h2><span>{t.documentPerception}</span><p>{locale === "pl" ? "Na podstawie treści i struktury CV. To nie jest ocena osoby." : "Based on the CV's content and structure. This is not an assessment of the person."}</p></div>
          <div className="report-actions">
            {demo || paid ? <button className="report-download" onClick={() => window.print()}>{t.print}</button> : null}
            {!demo ? <button className="report-download" onClick={copySecureLink}>{linkState === "copied" ? t.copied : linkState === "error" ? t.copyFailed : t.copyLink}</button> : null}
            {!demo ? <button className="delete-link" onClick={remove}><LockIcon/>{t.delete}</button> : null}
          </div>
        </header>
        <section className="report-mobile-summary" aria-label={!paid && !demo ? t.mobileSummary : t.overall}>
          <div className="report-mobile-score"><span>{t.overall}</span><ScoreRing score={data.summary.overallScore} ariaLabel={locale === "pl" ? `Wynik ${data.summary.overallScore} na 100` : `Score ${data.summary.overallScore} out of 100`} statusLabel={locale === "pl" ? "Dobry kierunek" : "Good direction"}/></div>
          <div className="report-mobile-summary-copy">
            <span className="report-mobile-summary-title">{!paid && !demo ? t.mobileSummary : t.overall}</span>
            <div className="report-mobile-signals"><div><span>{t.perceivedLevel}</span><strong>{data.document.perceivedRole} · {seniorityLabel(data.document.perceivedSeniority)}</strong></div><div><span>{t.first20}</span><strong className={data.recruiterSimulation.simulatedDecision}>{decisionLabel[data.recruiterSimulation.simulatedDecision]}</strong></div></div>
            <p className="verdict">{data.summary.oneSentenceVerdict}</p>
          </div>
          {!paid && !demo ? <div className="report-mobile-offer">
            <span>{t.fullIncludes}</span>
            <ul><li><b>{counts.issues}</b> {locale === "pl" ? "problemów" : "issues"}</li><li><b>{counts.strengths}</b> {locale === "pl" ? "mocnych stron" : "strengths"}</li><li><b>{counts.nextSteps}</b> {locale === "pl" ? "priorytetów" : "priorities"}</li></ul>
            <button ref={mobileSummaryCta} onClick={() => void unlock("mobile_summary")} disabled={busy} className="button" data-purchase-surface="mobile_summary" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button>
            <small>{t.oneTime}</small>
          </div> : null}
        </section>
        {expiresAt ? <p className="report-expiry">{t.expires}: <time dateTime={expiresAt}>{new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", { dateStyle: "long" }).format(new Date(expiresAt))}</time></p> : null}

        <section className="report-section recruiter-perspective">
          <div className="section-heading"><span>01</span><h2>{t.profile}</h2></div>
          <div className="recruiter-profile"><div><span>{t.perceivedLevel}</span><p>{data.recruiterPerspective.profileSummary}</p></div><aside className={`seniority-alignment ${data.recruiterPerspective.seniorityAlignment}`}><strong>{seniorityLabel(data.document.perceivedSeniority)}</strong><p>{data.recruiterPerspective.seniorityAlignmentExplanation}</p></aside></div>
          {full ? <div className="recruiter-map"><div><h3>{t.signals}</h3>{full.recruiterPerspective.positiveSignals.map((signal) => <article key={signal.title}><CheckIcon/><div><b>{signal.title}</b><p>{signal.explanation}</p></div></article>)}</div><div><h3>{t.reservations}</h3>{full.recruiterPerspective.reservations.map((item) => <article key={item.title}><span aria-hidden="true">!</span><div><b>{item.title}</b><p>{item.explanation}</p></div></article>)}</div><div><h3>{t.questions}</h3>{full.recruiterPerspective.likelyInterviewQuestions.map((item, index) => <article key={item.question}><span>{index + 1}</span><div><b>{item.question}</b><p>{item.whyThisQuestion}</p></div></article>)}</div></div> : null}
        </section>

        <section className="report-section timeline">
          <div className="section-heading"><span>02</span><h2>{t.first20}</h2></div>
          <div className="timeline-grid">{[data.recruiterSimulation.after5Seconds, data.recruiterSimulation.after10Seconds, data.recruiterSimulation.after20Seconds].map((text, index) => <article key={t.after[index]}><b>{index + 1}</b><div><h3>{t.after[index]}</h3><p>{text}</p></div></article>)}<div className={`decision ${data.recruiterSimulation.simulatedDecision}`}><span>{t.simulated}</span><strong>{decisionLabel[data.recruiterSimulation.simulatedDecision]}</strong></div></div>
          <p className="disclaimer">{t.disclaimer}</p><div className="improve"><b>{t.improve}</b><ul>{data.recruiterSimulation.whatCouldImproveDecision.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </section>

        <section className="report-section">
          <div className="section-heading"><span>03</span><h2>{t.categories}</h2></div>
          <div className="score-rows">{data.categoryScores.map((category) => <div key={category.key}><b>{category.label}</b><p>{category.rationale}</p><strong>{category.score}<small>/100</small></strong><i><span style={{ width: `${category.score}%` }}/></i></div>)}</div>
        </section>

        {full ? <>
          <section className="report-section"><div className="section-heading"><span>04</span><h2>{t.fullIssues}</h2></div><div className="issues">{full.issues.map((issue, index) => <article key={issue.id}><header><span className={`severity ${issue.severity}`}>{issue.severity}</span><span>{issue.suggestion?.type.toUpperCase()}</span><b>{String(index + 1).padStart(2, "0")}</b></header><h3>{issue.title}</h3><div className="issue-grid"><div><small>{t.problem}</small><p>{issue.explanation}</p></div><div><small>{t.matters}</small><p>{issue.whyItMatters}</p></div><div><small>{t.evidence}</small>{issue.evidenceRefs.length ? issue.evidenceRefs.map((ref) => <blockquote className="evidence-quote" key={ref}>{full.evidenceMap?.[ref] || (demo ? demo.evidence[ref] : null) || (locale === "pl" ? "Dowód niedostępny w starszej wersji raportu." : "Evidence unavailable in this legacy report.")}</blockquote>) : <p>{locale === "pl" ? "Brak bezpośredniego dowodu — luka lub pytanie." : "No direct evidence — this is a gap or question."}</p>}</div><div><small>{t.action}</small><p>{normalizeIssueAction({ action: issue.action, suggestionType: issue.suggestion?.type, title: issue.title, locale, factualityNote: issue.suggestion?.factualityNote })}</p>{issue.suggestion?.proposed ? <blockquote>{issue.suggestion.proposed}</blockquote> : null}</div></div><footer>{t.confidence}: <b>{confidenceLabel[locale][issue.confidence]}</b> · {issue.suggestion?.factualityNote}</footer></article>)}</div></section>
          <section className="report-section report-summary-grid"><div><h2>{t.strengths}</h2>{full.strengths.map((item) => <article key={item.id}><CheckIcon/><div><b>{item.title}</b><p>{item.explanation}</p></div></article>)}</div><div><h2>{t.nextSteps}</h2>{full.nextSteps.toSorted((a, b) => a.priority - b.priority).map((item) => <article key={item.priority}><span>{item.priority}</span><div><b>{item.title}</b><p>{item.action}</p></div></article>)}</div></section>
          {demo ? <section className="report-section sample-cta"><div><h2>{locale === "pl" ? "Co mówi Twoje CV?" : "What does your CV communicate?"}</h2><p>{locale === "pl" ? "Zobacz bezpłatny wynik i najważniejszy dowód." : "See your free result and most important evidence."}</p></div><Link className="button" href={analysisPath(locale)}>{t.analyze}<ArrowIcon/></Link></section> : <section className="report-section feedback"><h2>{t.feedback}</h2>{sent ? <p>{t.thanks}</p> : <form onSubmit={feedback}><label>{t.rating}<select name="rating" defaultValue="5">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>{t.accuracy}<select name="accurate" defaultValue="yes"><option value="yes">{t.accurate[0]}</option><option value="partly">{t.accurate[1]}</option><option value="no">{t.accurate[2]}</option></select></label><label>{t.comment}<textarea name="comment" maxLength={1000}/></label><small>{t.feedbackPrivacy}</small><button className="button">{t.send}</button></form>}</section>}
        </> : <section ref={paywall} className="locked"><LockIcon/><h2>{t.lockedTitle}</h2><p>{t.lockedCopy}</p><div className="locked-counts"><span>{counts.issues} {locale === "pl" ? "problemów" : "issues"}</span><span>{counts.strengths} {locale === "pl" ? "mocnych stron" : "strengths"}</span><span>{counts.nextSteps} {locale === "pl" ? "priorytetów" : "priorities"}</span></div><div className={`locked-payment-actions${expressWalletAvailable ? " wallet-ready" : ""}`}><button onClick={() => void unlock("report_paywall")} disabled={busy} className="button" data-purchase-surface="report_paywall" data-payment-method="standard"><LockIcon/>{busy ? "…" : `${t.unlock} — ${price}`}</button><ExpressWalletCheckout enabled={!mockMode} locale={locale} plan={plan} measurementContext={measurementContext} purchaseSurface="report_paywall" onAvailabilityChange={setExpressWalletAvailable}/></div><div className="payment-methods-list" aria-label={t.paymentMethodsLabel}><span>{t.paymentMethodsLabel}</span><ul>{t.paymentMethods.map((method) => <li key={method}>{method}</li>)}</ul></div><small>{t.oneTime}</small></section>}

        <nav className="report-knowledge"><span>{t.viewArticles}</span><div>{topicKeys.map((key) => { const [label, slug] = reportTopics[locale][key]; return <Link key={key} href={`${articlesPath(locale)}/${slug}`}>{label}<ArrowIcon/></Link>; })}<Link href={articlesPath(locale)}>{locale === "pl" ? "Wszystkie" : "All"}<ArrowIcon/></Link></div></nav>
      </div>
    </div>
    {!paid && !demo ? <button className="report-mobile-sticky-cta" data-visible={mobileStickyVisible ? "true" : "false"} data-purchase-surface="mobile_sticky" data-payment-method="standard" aria-hidden={!mobileStickyVisible} tabIndex={mobileStickyVisible ? 0 : -1} disabled={busy} onClick={() => void unlock("mobile_sticky")}><span><LockIcon/>{busy ? "…" : t.unlock}</span><strong>{price}</strong></button> : null}
    {mockMode ? <span className="dev-badge">DEV MOCK</span> : null}
  </main>;
}
