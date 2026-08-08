"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, CheckIcon, LockIcon } from "./icons";
import { Logo } from "./logo";

const fixture = new File(
  [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])],
  "syntetyczne-cv.pdf",
  { type: "application/pdf" },
);

const progressSteps = [
  ["Odczytujemy dokument", "Tekst i struktura dokumentu"],
  ["Maskujemy dane kontaktowe", "Email, telefon i adres"],
  ["Szukamy dowodów", "Role, projekty, rezultaty i ownership"],
  ["Budujemy raport", "Walidacja wyniku i sugestii"],
];

export function UploadFlow({ mockMode, initialJobMatch }: { mockMode: boolean; initialJobMatch: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(mockMode ? fixture : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [seniority, setSeniority] = useState("auto");
  const [job, setJob] = useState(initialJobMatch ? "Wklej tutaj treść ogłoszenia…" : "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !consent) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("seniority", seniority);
    form.set("jobDescription", job);
    try {
      const response = await fetch("/api/analyses", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/pl/raport/${data.accessToken}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się rozpocząć analizy.");
      setLoading(false);
    }
  }

  return <main className="analysis-page">
    <header className="site-header container"><Logo /><a href="/pl#jak">Jak to działa</a></header>
    <div className="analysis-shell container">
      <form onSubmit={submit}>
        <h1>Pokaż, co naprawdę mówi Twoje CV</h1>
        <button
          type="button"
          className={`dropzone ${file ? "has-file" : ""}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className="upload-icon" aria-hidden="true">↑</span>
          <b>{file ? file.name : "Przeciągnij PDF lub DOCX"}</b>
          <u>{file ? "Wybierz inny plik" : "albo wybierz plik"}</u>
          <small>Maksymalnie 8 MB. Plik źródłowy usuniemy po analizie.</small>
        </button>
        <input ref={input} hidden type="file" accept=".pdf,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />

        <label>Rola<select aria-label="Rola"><option>Frontend Developer</option></select></label>
        <fieldset>
          <legend>Poziom</legend>
          <div className="segmented">
            {[["auto", "Rozpoznaj automatycznie"], ["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"], ["lead", "Lead"]].map(([value, label]) => <label key={value}>
              <input type="radio" name="seniority" value={value} checked={seniority === value} onChange={() => setSeniority(value)} />
              <span>{label}</span>
            </label>)}
          </div>
        </fieldset>
        <label>Treść ogłoszenia <small>(opcjonalnie)</small>
          <textarea value={job} onChange={(event) => setJob(event.target.value)} maxLength={20000} placeholder="Wklej treść ogłoszenia, aby dopasować analizę do wymagań." />
        </label>
        <label className="consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>Zgadzam się na przetworzenie dokumentu w celu przygotowania analizy.</span>
        </label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button submit" disabled={!file || !consent || loading}>{loading ? "Analizujemy…" : "Analizuj CV"}<ArrowIcon /></button>
        <p className="form-trust"><LockIcon /> Twoje dane są prywatne i nie trafiają do pracodawców.</p>
      </form>

      <aside className="analysis-aside">
        <div className="analysis-status">
          <span className={loading ? "status-orbit active" : "status-orbit"} aria-hidden="true" />
          <div><h2>{loading ? "Analizujemy Twoje CV" : "Dowód przed opinią"}</h2><p>{loading ? "Przechodzimy przez dokument krok po kroku." : "Każda ważna uwaga wskazuje fragment dokumentu."}</p></div>
        </div>
        <ol>{progressSteps.map(([step, detail], index) => <li className={loading && index < 3 ? "active" : ""} key={step}>
          {loading && index < 2 ? <CheckIcon /> : <span>{index + 1}</span>}
          <div><b>{step}</b><small>{detail}</small></div>
        </li>)}</ol>
        <div className="evidence-preview">
          <span className="evidence-mark" aria-hidden="true">“</span>
          <div><b>Raport nie zgaduje</b><p>Jeśli informacji nie ma w CV, zobaczysz „brak dowodu”, a nie fałszywy wniosek.</p></div>
        </div>
      </aside>
    </div>
    {mockMode ? <div className="dev-badge">DEV · MOCK MODE</div> : null}
  </main>;
}
