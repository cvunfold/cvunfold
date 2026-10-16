"use client";
import Link from "next/link";
import { useState, useRef, type FormEvent } from "react";
import { FilePicker } from "@/components/file-picker";
import { expandSchoolFiles, studentNameFromFilename } from "@/lib/schools/upload-files";
import { INITIAL_ANALYSIS_MS, type SchoolAnalysisTiming } from "@/lib/schools/upload-model";
type Item = { file: File; name: string; manual: boolean; status: string };
async function request(body: unknown) {
  const response = await fetch("/api/schools/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Nie udało się przesłać paczki.");
  return payload as { batchId: string; alreadySubmitted?: boolean; jobs: { id: string; url: string }[] };
}
export function SchoolBatchUpload({ groupId, remainingSeats, timing, onBusy, onSubmitted, onClose }: {
  groupId: string; remainingSeats: number; timing?: SchoolAnalysisTiming; onBusy: (busy: boolean) => void; onSubmitted: () => Promise<void>; onClose: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]), [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const requestId = useRef<string | null>(null), batchId = useRef<string | null>(null), [locked, setLocked] = useState(false);
  const totalMinutes = Math.ceil(items.length * ((timing?.averageMs || INITIAL_ANALYSIS_MS) + 30_000) / 60_000);
  function lock(value: boolean) { setBusy(value); onBusy(value); }
  async function select(files: File[]) {
    lock(true); setError("");
    try {
      const expanded = await expandSchoolFiles(files);
      if (expanded.length > remainingSeats) throw new Error(`W grupie pozostało ${remainingSeats} miejsc. Wybierz mniejszą paczkę.`);
      setItems(expanded.map(file => ({ file, name: studentNameFromFilename(file.name), manual: false, status: "Gotowy do przesłania" })));
      requestId.current = null;
    } catch (caught) { setItems([]); setError(caught instanceof Error ? caught.message : "Nie udało się odczytać plików."); }
    finally { lock(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || !consent || !items.length) return;
    lock(true); setError(""); setLocked(true);
    try {
      if (!batchId.current) {
        requestId.current ||= crypto.randomUUID();
        const prepared = await request({ action: "prepare", groupId, requestId: requestId.current, consent: true, files: items.map(item => ({ name: item.file.name, size: item.file.size, studentName: item.name, manual: item.manual })) });
        batchId.current = prepared.batchId;
        if (!prepared.alreadySubmitted) {
          let next = 0;
          async function transfer() {
            while (next < items.length) {
              const index = next++, item = items[index];
              setItems(rows => rows.map((row,i) => i === index ? { ...row, status: "Przesyłanie…" } : row));
              try {
                const response = await fetch(prepared.jobs[index].url, { method: "PUT", headers: { "Content-Type": item.file.type || "application/octet-stream", "x-upsert": "false" }, body: item.file });
                if (!response.ok) throw new Error("UPLOAD_FAILED");
                setItems(rows => rows.map((row,i) => i === index ? { ...row, status: "Przesłano" } : row));
              } catch { setItems(rows => rows.map((row,i) => i === index ? { ...row, status: "Błąd przesyłania" } : row)); }
            }
          }
          await Promise.all(Array.from({ length: Math.min(3, items.length) }, () => transfer()));
        }
      }
      await request({ action: "commit", batchId: batchId.current });
      await onSubmitted();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się potwierdzić paczki. Ponów zapis."); }
    finally { lock(false); }
  }
  return <form onSubmit={submit} className="school-card school-form school-batch-upload"><span className="school-eyebrow">Cała grupa za jednym razem</span><h2>Prześlij paczkę CV</h2>
    <p>Do 30 CV, PDF lub DOCX. Możesz wybrać wiele plików albo ZIP. Maksymalnie 8 MB na CV i 100 MB na paczkę. Pozostałe miejsca w grupie: {remainingSeats}.</p>
    <FilePicker label="Pliki CV lub paczka ZIP" multiple accept=".pdf,.docx,.zip" formatLabel="PDF / DOCX / ZIP" files={items.map(item => item.file)} disabled={busy || locked} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void select(files); }}/>
    {items.length ? <><p className="school-muted">Nazwy rozpoznajemy z nazw plików, a po odczytaniu CV także z nagłówka dokumentu. Twoja ręczna korekta ma pierwszeństwo.</p><div className="school-batch-files">{items.map((item,index) => <div className="school-batch-file" key={index}><label>Imię i nazwisko kursanta<input required maxLength={120} value={item.name} disabled={busy || locked} onChange={event => setItems(rows => rows.map((row,i) => i === index ? { ...row, name: event.target.value, manual: true } : row))}/><small>{item.file.name}</small></label><span role="status">{item.status}</span></div>)}</div><p>Szacowany czas po przesłaniu: około {totalMinutes} min. {timing?.sampleCount ? `Na podstawie ${timing.sampleCount} ostatnich analiz.` : "Wstępnie zakładamy 2 min na CV; estymacja dostosuje się do rzeczywistych czasów."}</p></> : null}
    <label className="school-consent"><input type="checkbox" required disabled={busy || locked} checked={consent} onChange={event => setConsent(event.target.checked)}/>Mam prawo przekazać te CV do analizy i poinformowałem kursantów o przetwarzaniu dokumentów, raportów i danych kontaktowych. Pliki będą tymczasowo przechowywane w prywatnym magazynie, usuwane po przetworzeniu, najpóźniej w ramach sprzątania po 24 godzinach. Raporty wygasają zgodnie z okresem widocznym przy raporcie.</label>
    <Link href="/polityka-prywatnosci">Zasady prywatności</Link>
    {error ? <p role="alert" className="school-error">{error}</p> : null}
    <p className="school-muted">Poczekaj na potwierdzenie przesłania paczki. Wtedy możesz zamknąć stronę, a analizy będą wykonywane na serwerze.</p>
    <div className="school-actions"><button className="button button-primary" disabled={busy || !consent || !items.length || items.some(item => !item.name.trim())}>{busy ? "Przesyłanie i zapisywanie paczki…" : locked ? "Ponów zapis paczki" : "Prześlij i analizuj w tle"}</button><button type="button" disabled={busy} onClick={async () => { if (!locked || !requestId.current) { onClose(); return; } lock(true); setError(""); try { await request({ action: "cancel", requestId: requestId.current }); onClose(); } catch { setError("Nie udało się anulować paczki. Spróbuj ponownie."); } finally { lock(false); } }}>Anuluj</button></div>
  </form>;
}
