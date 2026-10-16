"use client";
import { schoolDate } from "@/lib/schools/date-format";
import { FilePicker } from "@/components/file-picker";
import { useRef, useState, type FormEvent } from "react";
import type { SchoolReport } from "@/lib/schools/model";
import { SCHOOL_PILOT } from "@/lib/schools/pilot-plan";
export function SchoolRevisionTools({ id, data, demo, onVersion }: { id: string; data: SchoolReport; demo: boolean; onVersion: (version: number) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  async function select(version: number) { setBusy(true); setError(""); try { await onVersion(version); } catch { setError("Nie udało się otworzyć wersji. Spróbuj ponownie."); } finally { setBusy(false); } }
  async function recheck(event: FormEvent) {
    event.preventDefault(); if (!file || !consent || busy || demo) return;
    setBusy(true); setError(""); requestId.current ||= crypto.randomUUID();
    const form = new FormData(); form.set("file",file); form.set("requestId",requestId.current); form.set("schoolConsent","true");
    try {
      const response = await fetch(`/api/schools/reports/${encodeURIComponent(id)}/revisions`, { method: "POST", body: form });
      const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.error || "Nie udało się sprawdzić CV.");
      await onVersion(payload.version); setFile(null); setConsent(false); requestId.current=null; if (fileInput.current) fileInput.current.value="";
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Spróbuj ponownie."); }
    finally { setBusy(false); }
  }
  return <section className="school-card school-versions" aria-label="Wersje CV kursanta">
    <h2>Poprawki i kolejne wersje CV</h2><p>Każda wersja należy do tego samego kursanta. Zachowujemy rolę i etap kariery. Nowa wersja nie dodaje osoby do grupy.</p>
    <nav className="school-version-list" aria-label="Wersje raportu">{data.revisions?.map(row => <button key={row.version} type="button" aria-pressed={row.version === (data.version || 0)} disabled={busy} onClick={() => void select(row.version)}><span>{row.version === 0 ? "Pierwsza analiza" : `Po poprawkach ${row.version}`}</span><strong>{demo && row.version > 0 && data.demoRevisionPreview ? "Bez nowej oceny" : `${row.score}/100`}</strong><small>{schoolDate(row.createdAt)}</small></button>)}</nav>
    {demo ? <p className="school-muted">{(data.revisions?.length || 0) > 1 ? data.demoRevisionPreview ? "Przełącz wersje, aby zobaczyć redakcyjną poprawkę dokumentu bez ponownej analizy AI." : "Przełącz wersje, aby porównać dwa zapisane raporty AI: oceny, uwagi, cytaty i wynik ATS." : "Ten przykład pokazuje pierwszą analizę i oczekuje na poprawione CV. Demo nie przyjmuje nowych plików; możesz odpowiedzieć na pytania i zaplanować poprawki."}</p> : !data.iterationsAvailable ? <p>Historia wersji nie jest jeszcze skonfigurowana w tym środowisku.</p> : data.recheckRunning ? <p role="status">Analiza poprawionego CV trwa. Odśwież raport za chwilę.</p> : (data.rechecksRemaining || 0) > 0 ? <form onSubmit={recheck}>
      <p>Pozostałe sprawdzenia: {data.rechecksRemaining} z {SCHOOL_PILOT.rechecks}. Dostępne do wygaśnięcia raportu.</p>
      <FilePicker label="Poprawione CV" inputRef={fileInput} files={file ? [file] : []} disabled={busy} onChange={event => {setFile(event.target.files?.[0] || null); requestId.current=null; setError("");}}/>
      <label className="school-consent"><input type="checkbox" required disabled={busy} checked={consent} onChange={event => setConsent(event.target.checked)}/>Mam prawo przekazać poprawione CV tego kursanta do analizy.</label>
      <button className="button" type="submit" disabled={!file || !consent || busy}>{busy ? "Sprawdzamy poprawione CV…" : "Sprawdź poprawione CV"}</button>
    </form> : <p>Ponowne sprawdzenie wykorzystane. Obie wersje pozostają dostępne do wygaśnięcia raportu.</p>}
    <p className="school-muted">Porównuj także uwagi i dowody. Wynik może wzrosnąć, spaść albo pozostać taki sam.</p>{error ? <p className="school-error" role="alert">{error}</p> : null}
  </section>;
}
