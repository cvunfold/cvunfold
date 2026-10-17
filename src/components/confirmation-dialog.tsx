"use client";

import { useEffect, useId, useRef } from "react";
import { Trash2, X } from "lucide-react";

export function ConfirmationDialog({ title, description, confirmLabel, busy, error, onCancel, onConfirm, locale = "pl" }: {
  title: string; description: string; confirmLabel: string; busy: boolean; error?: string;
  onCancel: () => void; onConfirm: () => void; locale?: "pl" | "en";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal(); cancelRef.current?.focus(); document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={dialogRef} className="app-confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <button className="app-dialog-close" type="button" disabled={busy} onClick={onCancel} aria-label={locale === "pl" ? "Zamknij potwierdzenie" : "Close confirmation"}><X aria-hidden="true"/></button>
    <Trash2 className="app-dialog-icon" aria-hidden="true"/>
    <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>{description}</p>
    {error ? <p className="app-form-error" role="alert">{error}</p> : null}
    <div className="app-dialog-actions"><button ref={cancelRef} type="button" disabled={busy} onClick={onCancel}>{locale === "pl" ? "Anuluj" : "Cancel"}</button>
      <button className="app-dialog-confirm" type="button" disabled={busy} onClick={onConfirm}>{busy ? (locale === "pl" ? "Usuwanie…" : "Deleting…") : confirmLabel}</button></div>
  </dialog>;
}
