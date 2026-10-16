"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { cvStoryPath } from "@/lib/i18n";
import { Check, FileUp, ScanLine, Eye, ListChecks, NotebookPen, MessageCircle, Pause, Play, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { DocumentScanner } from "./document-scanner";

const stages = [
  { id: "upload", duration: 4200, icon: FileUp },
  { id: "analysis", duration: 4600, icon: ScanLine },
  { id: "preview", duration: 6800, icon: Eye },
  { id: "report", duration: 6800, icon: ListChecks },
  { id: "revision", duration: 7800, icon: NotebookPen },
  { id: "improved", duration: 9000, icon: Check },
] as const;

const copy = {
  pl: {
    label: "Zobacz, jak CV przechodzi w konkretny plan poprawek",
    stages: ["Twoje CV", "Analiza", "Wynik", "Raport", "Poprawki", "Po zmianach"],
    titles: ["Zaczynamy od Twojego CV", "Czytamy dokument, szukamy dowodów", "Pierwsza konkretna uwaga", "Wiesz, co poprawić najpierw", "Od diagnozy do dobrych pytań", "To samo doświadczenie. Lepiej opisane."],
    pause: "Wstrzymaj prezentację", play: "Odtwórz prezentację", navigation: "Etapy analizy CV", goTo: "Pokaż etap:",
    upload: "PDF lub DOCX", received: "Dokument gotowy do analizy", reading: "Odczytujemy treść", criteria: "Dobieramy kryteria do roli i poziomu", evidence: "Łączymy uwagi z fragmentami CV",
    free: "Bezpłatny wynik wstępny", finding: "Projekt nie pokazuje samodzielnego wkładu",
    excerpt: "Praca przy komponentach i stylowaniu aplikacji.", quoteLabel: "Dowód z CV",
    interpretation: "Nie widać, co powstało poza instrukcją kursu.",
    full: "Pełny raport", reportHeading: "Twoja kolejność poprawek", payment: "Odblokowujesz tylko, jeśli chcesz", priorities: ["Własny wkład w projekcie", "Dowody praktyki i sprawdzania działania", "Czytelny opis przygotowania do roli"],
    detail: "Uwagi, cytaty i kolejność poprawek w jednym miejscu.",
    brief: "Podsumowanie do Twojego AI", briefHeading: "Najpierw pytania. Potem poprawki.", question: "Co zrobiłaś samodzielnie?", wait: "Najpierw Twoja odpowiedź", rules: ["AI pyta o brakujące fakty", "Czeka na Twoje odpowiedzi", "Proponuje poprawki bez dopisywania faktów"],
    note: "Przykładowy przebieg · fikcyjne CV",
  },
  en: {
    label: "See how a CV becomes a concrete revision plan",
    stages: ["Your CV", "Review", "Preview", "Report", "Next steps", "Improved CV"],
    titles: ["It starts with your CV", "We read the document and look for evidence", "Your first concrete finding", "You know what to improve first", "From findings to useful questions", "The same experience. More clearly described."],
    pause: "Pause presentation", play: "Play presentation", navigation: "CV review stages", goTo: "Show stage:",
    upload: "PDF or DOCX", received: "Document ready for review", reading: "Reading the content", criteria: "Choosing criteria for your role and level", evidence: "Linking findings to CV excerpts",
    free: "Free initial result", finding: "The project does not show an independent contribution",
    excerpt: "Worked on components and application styling.", quoteLabel: "Evidence from the CV",
    interpretation: "It is unclear what was built beyond the course instructions.",
    full: "Full report", reportHeading: "Your revision priorities", payment: "Unlock it only if you want to", priorities: ["Your own contribution to the project", "Evidence of practice and verification", "A clear description of your preparation"],
    detail: "Findings, quotes and priorities in one place.",
    brief: "A summary for your own AI", briefHeading: "Questions first. Then edits.", question: "What did you build independently?", wait: "Your answer comes first", rules: ["AI asks about missing facts", "Waits for your answers", "Suggests edits without inventing facts"],
    note: "Illustrative flow · fictional CV",
  },
} as const;

export function CvFlowPreview({ locale, price, children }: { locale: Locale; price: string; children: ReactNode }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const [{ step, cycle }, setStage] = useState({ step: 0, cycle: 0 });
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const remaining = useRef<number>(stages[0].duration);
  const previousCycle = useRef(0);
  const running = playing && visible && pageVisible && !reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setReducedMotion(Boolean(preference?.matches));
      if (preference?.matches) setPlaying(false);
    };
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    updatePreference();
    updateVisibility();
    preference?.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = window.IntersectionObserver && new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (observer && root.current) observer.observe(root.current);
    else setVisible(true);
    return () => {
      observer?.disconnect();
      preference?.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (previousCycle.current !== cycle) {
      remaining.current = stages[step].duration;
      previousCycle.current = cycle;
    }
    if (!running) return;
    const start = performance.now();
    const timer = window.setTimeout(() => setStage(current => ({ step: (current.step + 1) % stages.length, cycle: current.cycle + 1 })), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - start));
    };
  }, [step, cycle, running]);

  function chooseStage(index: number) {
    setStage(current => ({ step: index, cycle: current.cycle + 1 }));
    setPlaying(!reducedMotion);
  }

  const StageIcon = stages[step].icon;
  return <figure id="cv-flow-preview" ref={root} className="cv-product-preview cv-flow-preview" aria-label={t.label} data-step={stages[step].id} data-running={running} style={{ "--flow-duration": `${stages[step].duration}ms`, "--flow-play-state": running ? "running" : "paused" } as CSSProperties}>
    <div className="cv-flow-toolbar">
      <span><StageIcon aria-hidden="true"/><span>{t.stages[step]}</span><small>{String(step + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</small></span>
      {!reducedMotion ? <button className="cv-flow-play" onClick={() => setPlaying(current => !current)} aria-label={playing ? t.pause : t.play} title={playing ? t.pause : t.play}>{playing ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}</button> : null}
    </div>

    <div className="cv-flow-stage">
      <div className="cv-flow-document" aria-hidden={step > 1} inert={step > 1}>
        <div className="cv-preview-back" aria-hidden="true"/>
        {children}
        <DocumentScanner key={cycle} className="cv-flow-scan" paused={!running || step !== 1}/>
      </div>

      <div className="cv-flow-upload-note" aria-hidden={step !== 0}><FileUp aria-hidden="true"/><strong>{t.upload}</strong><span><Check aria-hidden="true"/>{t.received}</span></div>

      <div className="cv-flow-reading" aria-hidden={step !== 1}>
        <ScanLine aria-hidden="true"/><strong>{t.reading}</strong>
        <span><Check aria-hidden="true"/>{t.criteria}</span>
        <span><Check aria-hidden="true"/>{t.evidence}</span>
        <div className="cv-flow-reading-dots" aria-hidden="true"><i/><i/><i/></div>
      </div>

      <div className="cv-flow-panel cv-flow-result" aria-hidden={step !== 2}>
        <div className="cv-flow-panel-label"><Eye aria-hidden="true"/><span>{t.free}</span></div>
        <h3>{t.finding}</h3>
        <small>{t.quoteLabel}</small>
        <blockquote><mark>{t.excerpt}</mark></blockquote>
        <p>{t.interpretation}</p>
        <div className="cv-flow-result-line" aria-hidden="true"><i/><i/><i/></div>
      </div>

      <div className="cv-flow-panel cv-flow-report" aria-hidden={step !== 3}>
        <div className="cv-flow-panel-label"><ListChecks aria-hidden="true"/><span>{t.full}</span><b>{price}</b></div>
        <h3>{t.reportHeading}</h3>
        <ol>{t.priorities.map((item, index) => <li key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span><ArrowRight aria-hidden="true"/></li>)}</ol>
        <p>{t.detail}</p><small className="cv-flow-payment-note">{t.payment}</small>
      </div>

      <div className="cv-flow-panel cv-flow-improved" aria-hidden={step !== 5} inert={step !== 5}>
        <div className="cv-flow-panel-label"><Check aria-hidden="true"/><span>{locale === "pl" ? "Dwie iteracje poprawek" : "Two rounds of revisions"}</span></div>
        <h3>40 → 64 → 81<span className="cv-flow-score-unit"> / 100</span></h3>
        <ul><li>{locale === "pl" ? "Własny filtr kategorii i zapis koszyka ze wsparciem mentorki" : "Own category filter and cart persistence with mentor support"}</li><li>{locale === "pl" ? "6 testów w Vitest i poprawki po uwagach 2 koleżanek" : "6 Vitest tests and changes following feedback from 2 peers"}</li></ul>
        <p>{locale === "pl" ? "Bez nowego doświadczenia. Doprecyzowane fakty z odpowiedzi Natalii." : "No new experience. Facts clarified through Natalia’s answers."}</p>
        <Link href={cvStoryPath(locale)} prefetch={false}>{locale === "pl" ? "Zobacz zmiany i pełny raport" : "See the changes and full report"}<ArrowRight aria-hidden="true"/></Link>
        <small>{locale === "pl" ? "Fikcyjne CV · rzeczywisty test · wynik tego przykładu" : "Fictional CV · real test · this example’s result"}</small>
      </div>

      <div className="cv-flow-panel cv-flow-brief" aria-hidden={step !== 4}>
        <div className="cv-flow-panel-label"><NotebookPen aria-hidden="true"/><span>{t.brief}</span></div>
        <h3>{t.briefHeading}</h3>
        <ol>{t.rules.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}</ol>
        <div className="cv-flow-wait"><i aria-hidden="true"/>{t.wait}</div>
      </div>
      <aside className="cv-preview-question cv-flow-question" aria-hidden={step !== 4}><MessageCircle aria-hidden="true"/><span>{t.question}</span></aside>
    </div>

    <div className="cv-flow-caption" aria-live={playing ? "off" : "polite"}>{t.titles[step]}</div>
    <div className="cv-flow-navigation" role="group" aria-label={t.navigation}>
      {stages.map(({ id, icon: Icon }, index) => <button key={id} aria-pressed={step === index} aria-label={`${t.goTo} ${t.stages[index]}`} onClick={() => chooseStage(index)}>
        <span className="cv-flow-progress" key={`${id}-${cycle}`} aria-hidden="true"/>
        <Icon aria-hidden="true"/><span>{t.stages[index]}</span>
      </button>)}
    </div>
    <figcaption>{t.note}</figcaption>
  </figure>;
}
