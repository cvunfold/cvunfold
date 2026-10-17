"use client";
import { AnimatedDetails } from "@/components/animated-details";

import { FormSelect } from "@/components/form-select";
import { useState } from "react";
import type { CVReport } from "@/lib/ai/schemas/report";
import { schoolRevisionQuestions, type SchoolRevisionAnswer } from "@/lib/schools/revision-questions";
import { findSchoolAnswer, saveSchoolAnswers, schoolAnswerMethod, schoolAnswerNextAction, type SavedSchoolAnswer } from "@/lib/schools/revision-context";

export function SchoolRevisionQuestions({ report, version = 0, method = schoolAnswerMethod(report), saved = [], onSave }: { report: CVReport; version?: number; method?: string; saved?: SavedSchoolAnswer[]; onSave?: (records: SavedSchoolAnswer[]) => void }) {
  const questions = schoolRevisionQuestions(report);
  const [editing, setEditing] = useState<string[]>([]);
  const previous = Object.fromEntries(questions.flatMap(q => { const item = findSchoolAnswer(report, q, version, method, saved); return item ? [[q.id, item] as const] : []; }));
  const active = questions.filter(q => !previous[q.id] || previous[q.id].answer.status === "skipped" || editing.includes(q.id));
  const [answers, setAnswers] = useState<Record<string, SchoolRevisionAnswer>>({});
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("");
  const completed = active.every(question => {
    const answer = answers[question.id] || previous[question.id]?.answer;
    return answer && (answer.status !== "confirmed" || !!answer.text.trim());
  });
  function update(id: string, answer: SchoolRevisionAnswer) { setAnswers(current => ({ ...current, [id]: answer })); setStatus(""); setVerified(false); }
  return <section className="school-card school-revision-questions" aria-label="Odpowiedzi do poprawy CV">
    <span className="school-eyebrow">Najpierw fakty, potem poprawki</span><h2>Pytania przed poprawą CV</h2>
    <p>Odpowiedz z kursantem na braki wskazane w tym raporcie. Zalecenie pod pytaniem wskazuje, którego projektu i informacji dotyczy odpowiedź. Nie wpisuj przykładowych osiągnięć ani danych kontaktowych.</p>
    {saved.length ? <AnimatedDetails className="school-saved-answers" open><summary>Zapisane odpowiedzi ({saved.length})</summary>{saved.map(item => <article key={`${item.method}:${item.version}:${item.question.id}`}><h3>{item.question.title}</h3><p className="school-muted">Odpowiedź z wersji {item.version}. {item.question.question}</p><p>{item.answer.status === "confirmed" ? item.answer.text : { not_done: "Nie robiłem tego.", unknown: "Nie pamiętam lub nie mogę potwierdzić.", skipped: "Pomijam pytanie." }[item.answer.status]}</p><p>{schoolAnswerNextAction(item.answer, item.diagnosticKind)}</p></article>)}{Object.entries(previous).map(([id, item]) => <button key={id} type="button" onClick={() => { setEditing(current => [...current, id]); update(id, item.answer); }}>Zmień odpowiedź: {questions.find(q => q.id === id)!.title}</button>)}</AnimatedDetails> : null}
    {active.length ? <form onSubmit={event => {
      event.preventDefault(); if (!completed || !verified) return;
      try {
        const combined = { ...Object.fromEntries(Object.entries(previous).map(([id, item]) => [id, item.answer])), ...answers };
        const additions = Object.fromEntries(active.map(q => [q.id, combined[q.id]]));
        onSave?.(saveSchoolAnswers(report, version, method, additions, saved));
        setEditing([]); setStatus(onSave ? "Odpowiedzi zapisano w sesji panelu. Popraw CV własnymi słowami, korzystając z potwierdzonych faktów i zaleceń raportu." : "Odpowiedzi sprawdzone. Popraw CV własnymi słowami, korzystając z potwierdzonych faktów i zaleceń raportu.");
      } catch { setStatus("Nie udało się zapisać odpowiedzi. Sprawdź dostępność pamięci przeglądarki i spróbuj ponownie."); }
    }}>
      {active.map((question, index) => <fieldset key={question.id}><legend>{index + 1}. {question.title}</legend><p>{question.question}</p><p className="school-muted">Zalecenie z raportu: {question.instruction}</p>
        {!previous[question.id] && saved.some(item => item.method === method && item.version <= version) ? <AnimatedDetails><summary>Przypisz wcześniejszą odpowiedź do tego pytania</summary><p>Sprawdź, czy odpowiedź dotyczy tego samego projektu i tematu. Po przypisaniu ponownie sprawdź formularz przed zapisaniem.</p>{saved.filter(item => item.method === method && item.version <= version).map(item => <div key={`${item.version}:${item.question.id}`}><p>{item.question.title}: {item.answer.status === "confirmed" ? item.answer.text : { not_done: "Nie robiłem tego.", unknown: "Nie pamiętam lub nie mogę potwierdzić.", skipped: "Pomijam pytanie." }[item.answer.status]}</p><button type="button" onClick={() => update(question.id, item.answer)}>Użyj zapisanej odpowiedzi: {item.question.title}</button></div>)}</AnimatedDetails> : null}
        <FormSelect label={`Sposób odpowiedzi ${index + 1}`} value={answers[question.id]?.status || previous[question.id]?.answer.status || ""}
          onChange={value => update(question.id, { status: value as SchoolRevisionAnswer["status"], text: "" })} required
          options={[{ id: "confirmed", label: "Mogę potwierdzić konkretne fakty" }, { id: "not_done", label: "Nie robiłem tego" }, { id: "unknown", label: "Nie pamiętam lub nie mogę potwierdzić" }, { id: "skipped", label: "Pomijam pytanie" }]}/>
        {(answers[question.id] || previous[question.id]?.answer)?.status === "confirmed" ? <label>Fakty do pytania {index + 1}<textarea aria-label={`Fakty do pytania ${index + 1}`} required maxLength={1500} rows={4} value={(answers[question.id] || previous[question.id]?.answer)?.text || ""} onChange={event => update(question.id, { status: "confirmed", text: event.target.value })}/><small>Maksymalnie 1500 znaków. Opisz fakty, zakres własnej pracy i otrzymane wsparcie.</small></label> : null}
      </fieldset>)}
      <label className="school-consent"><input type="checkbox" required checked={verified} onChange={event => { setVerified(event.target.checked); setStatus(""); }}/>Odpowiedzi pochodzą od kursanta. Sprawdziliśmy całe CV i nie dopisujemy działań, których nie wykonał.</label>
      <button type="submit" className="button" disabled={!completed || !verified}>Zapisz sprawdzone odpowiedzi</button>
    </form> : <p>{questions.length ? "Te pytania mają już zapisane odpowiedzi. Nie zadajemy ich ponownie. Możesz zmienić odpowiedź, jeśli pojawiły się nowe fakty." : "Ten raport nie wymaga dopisywania nowych faktów w priorytetowych zaleceniach. Popraw istniejący opis zgodnie z konkretnymi radami w raporcie."}</p>}
    <p role="status">{status}</p><p className="school-muted">{onSave ? "Sprawdzone odpowiedzi zachowujemy w sesji tej karty przeglądarki, oddzielnie dla kursanta i metody analizy. Odświeżenie i zmiana wersji ich nie usuwają. Wylogowanie, zamknięcie karty lub wygaśnięcie raportu kończy ten zapis. Nie jest to zapis na koncie ani synchronizacja między urządzeniami. " : "Odpowiedzi pozostają w tym widoku. "}Nie wysyłamy ich do analityki ani do modelu oceniającego CV. Po samodzielnej poprawie zapisz PDF lub DOCX i prześlij go w sekcji „Poprawki i kolejne wersje CV”.</p>
  </section>;
}
