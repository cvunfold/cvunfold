"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

export function DeleteGroupDialog({ name, busy, error, onCancel, onConfirm }: {
  name: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialogRef} className="school-delete-dialog" aria-labelledby="school-delete-title" aria-describedby="school-delete-description" onCancel={event => {
    event.preventDefault();
    if (!busy) onCancel();
  }} onClick={event => {
    if (event.target !== event.currentTarget || busy) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
  }}>
    <button className="school-delete-close" type="button" aria-label="Zamknij potwierdzenie" disabled={busy} onClick={onCancel}><X size={20} aria-hidden="true"/></button>
    <div className="school-delete-icon"><Trash2 size={25} strokeWidth={1.6} aria-hidden="true"/></div>
    <span className="school-delete-eyebrow">Usuwanie grupy</span>
    <h2 id="school-delete-title">Usunąć tę grupę?</h2>
    <div className="school-delete-group"><span>Wybrana grupa</span><strong>{name}</strong></div>
    <p id="school-delete-description">Usuniemy wszystkie analizy, raporty i powiązane dane kursantów w tej grupie. <strong>Tej operacji nie można cofnąć.</strong></p>
    {error ? <p role="alert" className="school-delete-error">{error}</p> : null}
    <div className="school-delete-actions">
      <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel}>Anuluj</button>
      <button type="button" className="school-delete-confirm" disabled={busy} onClick={onConfirm}><Trash2 size={16} aria-hidden="true"/>{busy ? "Usuwanie…" : "Usuń grupę"}</button>
    </div>
  </dialog>;
}
