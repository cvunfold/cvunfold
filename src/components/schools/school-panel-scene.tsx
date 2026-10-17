"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Cpu, FileText, Pause, Play, Users } from "lucide-react";
import { MarketingReveal } from "@/components/marketing-reveal";
import type { Locale } from "@/lib/i18n";
import { getTargetRoleProfile } from "@/lib/roles";

const groups = [
  { id: "frontend", title: { pl: "Grupa Frontend", en: "Frontend group" }, students: [
    { name: "Karolina", role: "frontend_developer", score: 63, finding: { pl: "Ogólny opis indywidualnego wkładu", en: "Individual contribution is unclear" }, advice: { pl: "Doprecyzuj, którą funkcję przygotowałaś samodzielnie, a przy czym pomógł zespół.", en: "Name the feature you built independently and where the team helped." } },
    { name: "Bartek", role: "frontend_developer", score: 64, finding: { pl: "Nie opisano sprawdzenia projektu", en: "Project verification is not described" }, advice: { pl: "Opisz sprawdzone scenariusze i poprawkę, którą wprowadziłeś po znalezieniu błędu.", en: "Describe the scenarios you checked and the fix you made after finding a bug." } },
    { name: "Emilia", role: "frontend_developer", score: 54, finding: { pl: "Nieokreślony osobisty wkład w projekt", en: "Personal project ownership is unclear" }, advice: { pl: "Wskaż własne funkcje interfejsu i oddziel je od elementów z materiałów kursowych.", en: "Identify your own interface features separately from the course materials." } },
  ] },
  { id: "ai", title: { pl: "AI i automatyzacje", en: "AI & automation" }, students: [
    { name: "Natalia", role: "ai_llm_engineer", score: 67, finding: { pl: "Brak opisu sprawdzenia odpowiedzi RAG", en: "RAG response evaluation is missing" }, advice: { pl: "Pokaż, na jakich pytaniach sprawdzałaś odpowiedzi i jak wykrywałaś błędy.", en: "Describe the questions you used to evaluate responses and how you detected errors." } },
    { name: "Jakub", role: "ai_automation_specialist", score: 74, finding: { pl: "Niejasny zakres własnej automatyzacji", en: "Automation ownership is unclear" }, advice: { pl: "Oddziel gotowe integracje od własnej logiki i opisz obsługę nieudanych zadań.", en: "Separate ready-made integrations from your own logic and explain failed-task handling." } },
    { name: "Sara", role: "ai_llm_engineer", score: 82, finding: { pl: "Wynik modelu bez kontekstu porównania", en: "Model results lack a comparison baseline" }, advice: { pl: "Dodaj zbiór testowy, używaną metrykę i punkt odniesienia dla podanego wyniku.", en: "Add the test dataset, evaluation metric and baseline for the reported result." } },
  ] },
] as const;
const STEP_MS = 5000;

/** Illustrated examples only; no model calls or report generation on page visits. */
export function SchoolPanelScene({ locale = "pl" }: { locale?: Locale }) {
  const ref = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(preference.matches);
    const visibility = () => setTabVisible(!document.hidden);
    motion(); visibility();
    preference.addEventListener?.("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (ref.current) observer?.observe(ref.current);
    if (!observer) setVisible(true);
    return () => { observer?.disconnect(); preference.removeEventListener?.("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const playing = visible && tabVisible && !paused && !reducedMotion;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setFrame(current => (current + 1) % 6), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, frame]);
  const groupIndex = Math.floor(frame / 3), studentIndex = frame % 3;
  const group = groups[groupIndex], student = group.students[studentIndex];
  const select = (next: number) => { setFrame(next); setPaused(true); };
  return <MarketingReveal className="school-panel-scene">
    <aside ref={ref} data-playing={playing} aria-label={locale === "pl" ? "Ilustracja panelu szkoły z fikcyjnymi danymi" : "School panel illustration with fictional data"}>
      <header><h2>{group.title[locale]}</h2><span>{locale === "pl" ? "Fikcyjne dane" : "Fictional data"}</span></header>
      <div className="school-scene-toolbar">
        <div className="school-scene-groups" aria-label={locale === "pl" ? "Grupa w podglądzie" : "Preview group"}>
          {groups.map((item, index) => <button type="button" key={item.id} aria-pressed={groupIndex === index} onClick={() => select(index * 3)}>{index === 0 ? <Users size={15} aria-hidden="true"/> : <Cpu size={15} aria-hidden="true"/>}{index === 0 ? "Frontend" : "AI"}</button>)}
        </div>
        {!reducedMotion ? <button type="button" className="school-scene-playback" aria-label={locale === "pl" ? paused ? "Wznów animację" : "Wstrzymaj animację" : paused ? "Resume animation" : "Pause animation"} onClick={() => setPaused(current => !current)}>{paused ? <Play size={16} aria-hidden="true"/> : <Pause size={16} aria-hidden="true"/>}</button> : null}
      </div>
      <div className="school-scene-cohort" key={group.id}>
        <div className="school-scene-students">
          <div className="school-scene-labels"><span>{locale === "pl" ? "Kursant" : "Student"}</span><span>{locale === "pl" ? "Wynik analizy CV" : "CV review score"}</span></div>
          {group.students.map((item, index) => <button type="button" className={`school-scene-row ${index === studentIndex ? "highlighted" : ""}`} aria-pressed={index === studentIndex} key={item.name} onClick={() => select(groupIndex * 3 + index)}>
            <span className="school-scene-avatar" aria-hidden="true">{item.name[0]}</span><strong>{item.name}</strong><b>{item.score}<small>/100</small></b>
          </button>)}
        </div>
        <div className="school-scene-finding" key={student.name}><FileText aria-hidden="true"/><div><small>{locale === "pl" ? "UWAGA DO CV" : "CV FINDING"} · {student.name}</small><span className="school-scene-role">{getTargetRoleProfile(student.role, locale).label}</span><p>{student.finding[locale]}</p><span className="school-scene-advice">{student.advice[locale]}</span></div></div>
      </div>
      <Link href="/dla-szkol/demo" data-analytics-event="school_demo_clicked" data-analytics-placement="preview">{locale === "pl" ? "Zobacz panel na fikcyjnej grupie" : "Explore a fictional group (Polish)"}<ArrowRight size={16} aria-hidden="true"/></Link>
    </aside>
  </MarketingReveal>;
}
