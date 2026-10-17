"use client";
import { schoolDateTime, schoolTime } from "@/lib/schools/date-format";
import { useState } from "react";
import { Clock3, CheckCircle2, AlertTriangle } from "lucide-react";
import { AnimatedDetails } from "@/components/animated-details";
import { estimateSchoolReady, type SchoolUploadBatch, type SchoolAnalysisTiming } from "@/lib/schools/upload-model";
const labels = { uploading: "Przesyłanie nie zostało zakończone", queued: "W kolejce", processing: "Analizowanie", complete: "Raport gotowy", failed: "Wymaga ponownego przesłania" };
export function SchoolBatchProgress({ batches, timing, onResume }: { batches: SchoolUploadBatch[]; timing: SchoolAnalysisTiming; onResume?: (batchId: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (!batches.length) return null;
  const active = batches.filter(batch => batch.status !== "complete"), jobs = active.flatMap(batch => batch.jobs);
  const allJobs = batches.flatMap(batch => batch.jobs), completed = allJobs.filter(job => job.status === "complete").length, failed = allJobs.filter(job => job.status === "failed").length;
  const eta = estimateSchoolReady(jobs, timing);
  return <section className="school-card school-batch-progress" aria-label="Postęp paczek CV"><div className="school-batch-title">{active.length ? <Clock3 aria-hidden="true"/> : failed ? <AlertTriangle aria-hidden="true"/> : <CheckCircle2 aria-hidden="true"/>}<div><span className="school-eyebrow">Analiza w tle</span><h2>{active.length ? "Pracujemy nad CV Twojej grupy" : failed && !completed ? "Nie udało się przetworzyć CV" : failed ? "Przetwarzanie paczek zakończone" : "Paczka została przetworzona"}</h2></div></div>
    {eta.remaining ? <><p>Możesz zamknąć stronę i wrócić później. Gotowe: {eta.completed} z {jobs.length}. {eta.failed ? `Nieudane: ${eta.failed}.` : ""}</p><p><strong>Przewidywane zakończenie: około {schoolTime(eta.readyAt)}</strong> · około {Math.ceil(eta.remainingMs/60_000)} min</p><p className="school-muted">{timing.sampleCount ? `Średnia z ${timing.sampleCount} ostatnich analiz: około ${Math.ceil(timing.averageMs/1000)} s na CV.` : "Estymacja wstępna: 2 min na CV."} Uwzględniamy także oczekiwanie w kolejce. Czas może się zmienić.</p></> : active.length ? <p>Przesyłanie plików nie zostało zakończone. Rozwiń szczegóły paczki, aby uruchomić analizę plików, które dotarły na serwer. Niedokończona paczka wygaśnie po 24 godzinach.</p> : <p>Gotowe: {completed} z {allJobs.length}. {failed ? `Nieudane: ${failed}. Rozwiń szczegóły i dodaj błędne pliki ponownie.` : "Raporty są na liście kursantów poniżej."}</p>}
    {batches.map(batch => <AnimatedDetails key={batch.id}><summary>{`Paczka z ${schoolDateTime(batch.createdAt)} · ${batch.jobs.filter(job => job.status === "complete").length} z ${batch.jobs.length} gotowych`}</summary>{batch.status === "uploading" && onResume ? <><p>Uruchom analizę plików, które dotarły na serwer. Pozostałe będzie można dodać ponownie.</p><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await onResume(batch.id); } catch { setError("Nie udało się potwierdzić paczki. Spróbuj ponownie."); } finally { setBusy(false); } }}>Analizuj już przesłane CV</button></> : null}<ul className="school-batch-job-list">{batch.jobs.map(job => <li key={job.id}><strong>{job.name}</strong><span>{labels[job.status]}</span>{job.error ? <p className="school-error">{job.error}</p> : null}</li>)}</ul></AnimatedDetails>)}
  {error ? <p role="alert" className="school-error">{error}</p> : null}</section>;
}
