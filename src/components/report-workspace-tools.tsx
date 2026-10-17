"use client";
import { FilePicker } from "@/components/file-picker";
import { reportRequestHeaders } from "@/lib/client/report-access";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { Copy, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { RevisionSummary } from "@/lib/data/store";
import { TurnstileWidget } from "@/components/turnstile-widget";

type Props = { analysisId: string; locale: Locale; fullAccess: boolean; remaining: number; running: boolean; version: number; revisions: RevisionSummary[]; accessVisible?: boolean; onDismissAccess?: () => void; onVersion: (version: number) => Promise<unknown> };
export function ReportWorkspaceTools({ analysisId, locale, fullAccess, remaining, running, version, revisions, onVersion, accessVisible = true, onDismissAccess }: Props) {
  const pl = locale === "pl";
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [versionBusy, setVersionBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [epoch, setEpoch] = useState(0);
  const requestId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const onToken = useCallback((value: string) => setToken(value), []);
  async function saveLink() {
    setError("");
    try {
      const response = await fetch("/api/report/access-link", { method: "POST", headers: reportRequestHeaders() });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error();
      setLink(data.url);
      try { await navigator.clipboard.writeText(data.url); setCopied(true); } catch { setCopied(false); }
    } catch { setError(pl ? "Nie udało się przygotować linku. Spróbuj ponownie." : "Could not prepare the link. Try again."); }
  }
  async function selectVersion(nextVersion: number) {
    if (busy || versionBusy) return;
    setVersionBusy(true); setError("");
    try { if (!await onVersion(nextVersion)) throw new Error(); }
    catch { setError(pl ? "Nie udało się otworzyć tej wersji. Spróbuj ponownie." : "Could not open this version. Try again."); }
    finally { setVersionBusy(false); }
  }
  async function recheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true); setError("");
    requestId.current ||= crypto.randomUUID();
    const form = new FormData();
    form.set("file", file); form.set("analysisId", analysisId); form.set("requestId", requestId.current); form.set("turnstileToken", token);
    try {
      const response = await fetch("/api/report/revisions", { method: "POST", headers: reportRequestHeaders(), body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || (pl ? "Nie udało się sprawdzić CV." : "Could not recheck the CV."));
      if (!await onVersion(data.version)) throw new Error(pl ? "Wersja jest zapisana, ale nie udało się jej otworzyć. Spróbuj ponownie." : "The version is saved, but could not be opened. Try again.");
      setFile(null); requestId.current = null;
      if (fileInput.current) fileInput.current.value = "";
    } catch (caught) { setError(caught instanceof Error ? caught.message : (pl ? "Spróbuj ponownie." : "Please try again.")); }
    finally { setBusy(false); setToken(""); setEpoch(value => value + 1); }
  }
  if (!accessVisible && !fullAccess) return null;
  return <section className={`report-workspace${accessVisible ? "" : " without-access"}`} aria-label={pl ? "Powrót i kolejne wersje CV" : "Report access and CV versions"}>
    {accessVisible ? <div id="report-access-notice" className="report-access-notice" tabIndex={-1}><div className="report-save-access"><ShieldCheck aria-hidden="true"/><div><h2>{pl ? "Zachowaj dostęp do swojego raportu" : "Keep access to your report"}</h2><p>{pl ? "Zapisz prywatny link, żeby wrócić do raportu i sprawdzić poprawione CV. Link daje dostęp bez konta, więc zachowaj go dla siebie." : "Save your private link to return to the report and recheck your revised CV. It gives access without an account, so keep it private."}</p></div><button type="button" onClick={() => void saveLink()}><Copy aria-hidden="true"/>{copied ? (pl ? "Link skopiowany" : "Link copied") : (pl ? "Zapisz prywatny link" : "Save private link")}</button></div>
    {link ? <label className="report-private-link">{pl ? "Twój prywatny link" : "Your private link"}<input readOnly value={link} onFocus={event => event.currentTarget.select()}/></label> : null}
    {onDismissAccess ? <button className="report-access-close" type="button" onClick={onDismissAccess} aria-label={pl ? "Zamknij przypomnienie o linku" : "Dismiss link reminder"}><X aria-hidden="true"/></button> : null}</div> : null}
    {fullAccess ? <div className="report-rechecks"><div><span className="report-recheck-eyebrow">{pl ? "POPRAW I SPRAWDŹ PONOWNIE" : "REVISE AND RECHECK"}</span><h2>{pl ? "Zobacz, co zmieniło się w Twoim CV" : "See what changed in your CV"}</h2><p>{pl ? `Pozostałe sprawdzenia: ${remaining} z 2. Dostępne do wygaśnięcia raportu. Zachowujemy wybraną rolę i etap kariery.` : `Rechecks remaining: ${remaining} of 2. Within the original report access period, with the same role and career stage.`}</p></div>
      <nav className="report-version-list" aria-label={pl ? "Wersje raportu" : "Report versions"}>{revisions.map(row => <button key={row.version} type="button" aria-pressed={row.version === version} disabled={busy || versionBusy} onClick={() => void selectVersion(row.version)}><span>{row.version === 0 ? (pl ? "Pierwsza analiza" : "First review") : (pl ? `Po poprawkach ${row.version}` : `Revision ${row.version}`)}</span><strong>{row.score}/100</strong>{row.version > 0 ? <small>{row.score - revisions[0].score > 0 ? "+" : ""}{row.score - revisions[0].score} {pl ? "względem pierwszej" : "vs first review"}</small> : null}</button>)}</nav>
      {remaining > 0 && !running ? <form onSubmit={recheck}><FilePicker label={pl ? "Poprawione CV" : "Revised CV"} locale={locale} inputRef={fileInput} files={file ? [file] : []} disabled={busy || versionBusy} onChange={event => { setFile(event.target.files?.[0] || null); requestId.current = null; setError(""); }}/><TurnstileWidget key={epoch} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} locale={locale} onToken={onToken}/><button className="button button-primary" disabled={!file || busy || versionBusy} type="submit"><RefreshCw className={busy ? "report-recheck-spin" : ""} aria-hidden="true"/>{busy ? (pl ? "Sprawdzamy poprawione CV…" : "Rechecking your CV…") : (pl ? "Sprawdź poprawione CV" : "Recheck revised CV")}</button></form> : running ? <p role="status">{pl ? "Sprawdzenie trwa. Odśwież raport za chwilę, żeby zobaczyć wynik." : "A recheck is running. Refresh the report shortly to see the result."}</p> : <p>{pl ? "Oba sprawdzenia są wykorzystane. Wszystkie wersje możesz nadal przeglądać do wygaśnięcia raportu." : "Both rechecks have been used. All versions remain available until the report expires."}</p>}
      <p className="report-recheck-note">{pl ? "Porównuj także uwagi i dowody. Sam wynik może się nie zmienić, nawet jeśli opis jest czytelniejszy." : "Compare findings and evidence too. The score may stay the same even when the description becomes clearer."}</p>
    </div> : null}
    {error ? <p role="alert" className="report-workspace-error">{error}</p> : null}
  </section>;
}
