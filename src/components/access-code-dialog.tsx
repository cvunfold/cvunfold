"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, KeyRound, X } from "lucide-react";
import { analysisPath } from "@/lib/i18n";
import { ACCESS_CODE_EVENT } from "@/lib/client/access-code";

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'));
}

export function AccessCodeDialog() {
  const pathname = usePathname();
  const pl = !pathname.startsWith("/en");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [newAnalysisRequired, setNewAnalysisRequired] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    // Keep just the shortcut prefix, never input text or CV content.
    let sequence = "";
    let lastKey = 0;
    function onKey(event: KeyboardEvent) {
      if (open || event.defaultPrevented || document.querySelector("dialog[open]") || pathname.startsWith("/dla-szkol") || pathname.startsWith("/en/for-schools") || window.location.hostname === "szkoly.cvunfold.com") return;
      if (event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) { sequence = ""; return; }
      if (event.key.length !== 1) { sequence = ""; return; }
      const now = Date.now();
      if (now - lastKey > 2000) sequence = "";
      lastKey = now;
      const next = sequence + event.key.toLowerCase();
      sequence = "code".startsWith(next) ? next : (event.key.toLowerCase() === "c" ? "c" : "");
      if (sequence === "code") { event.preventDefault(); sequence = ""; setError(""); setAccepted(false); setCode(""); setOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal(); inputRef.current?.focus(); document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open]);

  useEffect(() => {
    if (accepted) dialogRef.current?.querySelector<HTMLElement>(".access-code-actions .button")?.focus();
  }, [accepted]);

  async function redeem(event: FormEvent) {
    event.preventDefault(); if (busy || !code.trim()) return;
    setBusy(true); setError("");
    const reportId = window.location.pathname.match(/^\/(?:raport|en\/report)\/([a-f0-9-]{36})$/i)?.[1];
    try {
      const response = await fetch("/api/report/access-code", { method: "POST", headers: { "Content-Type": "application/json", ...(reportId ? { "X-Report-ID": reportId } : {}) }, body: JSON.stringify({ code, ...(reportId ? { analysisId: reportId } : {}) }) });
      if (!response.ok) {
        setError(response.status === 429 ? (pl ? "Za dużo prób. Spróbuj ponownie później." : "Too many attempts. Please try again later.") : response.status === 503 ? (pl ? "Nie udało się teraz przyznać dostępu. Spróbuj ponownie." : "Could not grant access right now. Please try again.") : (pl ? "Kod jest nieprawidłowy lub niedostępny." : "The code is invalid or unavailable."));
        return;
      }
      const result = await response.json() as { unlocked?: boolean; newAnalysisRequired?: boolean };
      setCode(""); setAccepted(true); setReportUnlocked(Boolean(result.unlocked)); setNewAnalysisRequired(Boolean(result.newAnalysisRequired));
      if (result.unlocked) window.dispatchEvent(new Event(ACCESS_CODE_EVENT));
    } catch { setError(pl ? "Sprawdź połączenie i spróbuj ponownie." : "Check your connection and try again."); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return <dialog ref={dialogRef} className="app-confirm-dialog access-code-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); if (!busy) setOpen(false); }}>
    <button className="app-dialog-close" type="button" disabled={busy} onClick={() => setOpen(false)} aria-label={pl ? "Zamknij kod dostępu" : "Close access code"}><X aria-hidden="true"/></button>
    {accepted ? <Check className="app-dialog-icon" aria-hidden="true"/> : <KeyRound className="app-dialog-icon" aria-hidden="true"/>}
    <h2 id={`${id}-title`}>{accepted ? (pl ? "Kod przyjęty" : "Code accepted") : (pl ? "Masz kod dostępu?" : "Have an access code?")}</h2>
    <p id={`${id}-description`}>{accepted ? (reportUnlocked ? (pl ? "Pełny raport jest dostępny bez płatności. Liczbę pozostałych ponownych sprawdzeń zobaczysz w raporcie." : "Your full report is available without payment. See the report for your remaining rechecks.") : (pl ? `${newAnalysisRequired ? "Ten raport nie obsługuje ponownych sprawdzeń według aktualnych kryteriów. " : ""}Prześlij CV w ciągu godziny. Pełny raport i 2 ponowne sprawdzenia otrzymasz bez płatności.` : `${newAnalysisRequired ? "This report cannot be rechecked under the current criteria. " : ""}Upload your CV within an hour to get the full report and 2 rechecks without payment.`)) : (pl ? "Wpisz kod, aby otrzymać pełny raport bez płatności." : "Enter your code to get the full report without payment.")}</p>
    {accepted ? <div className="access-code-actions">{reportUnlocked || pathname === "/analiza" || pathname === "/en/analysis" ? <button className="button button-primary" onClick={() => setOpen(false)}>{pl ? "Kontynuuj" : "Continue"}</button> : <a className="button button-primary" href={analysisPath(pl ? "pl" : "en")}>{pl ? "Prześlij CV" : "Upload CV"}</a>}</div> : <form onSubmit={redeem}>
      <label htmlFor={`${id}-code`}>{pl ? "Kod dostępu" : "Access code"}</label>
      <input ref={inputRef} id={`${id}-code`} type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={128} required disabled={busy} value={code} onChange={event => setCode(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}/>
      {error ? <p id={`${id}-error`} className="app-form-error" role="alert">{error}</p> : null}
      <div className="access-code-actions"><button type="submit" className="button button-primary" disabled={busy || !code.trim()}>{busy ? (pl ? "Sprawdzanie…" : "Checking…") : (pl ? "Użyj kodu" : "Use code")}</button></div>
    </form>}
  </dialog>;
}
