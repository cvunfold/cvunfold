"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import { FolderPlus, X } from "lucide-react";
import { getTargetRoleOptions } from "@/lib/roles";
import { SchoolSelect } from "./school-select";

const roleOptions = getTargetRoleOptions("pl").filter(role => !role.experimental)
  .map(role => ({ id: role.id, label: role.label, mark: role.shortLabel }));
const stageOptions = [
  { id: "first_job", label: "Pierwsza praca w IT", mark: "IT" },
  { id: "junior", label: "Junior z doświadczeniem", mark: "JR" },
];

export function CreateGroupDialog({ busy, error, onCancel, onSubmit }: {
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    nameRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    if (busy) dialogRef.current?.focus();
  }, [busy]);

  return <dialog ref={dialogRef} className="school-create-dialog" tabIndex={-1} aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy} onKeyDown={event => {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not([type=hidden]):not(:disabled)")]
      .filter(control => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || document.activeElement === event.currentTarget) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }} onCancel={event => {
    event.preventDefault();
    if (!busy) onCancel();
  }} onClick={event => {
    if (event.target !== event.currentTarget || busy) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
  }}>
    <button className="school-create-close" type="button" aria-label="Zamknij nową grupę" disabled={busy} onClick={onCancel}><X size={20} aria-hidden="true"/></button>
    <div className="school-create-icon"><FolderPlus size={25} strokeWidth={1.6} aria-hidden="true"/></div>
    <span className="school-eyebrow">Grupa kursantów</span>
    <h2 id={titleId}>Nowa grupa</h2>
    <p id={descriptionId}>Ustal nazwę i wspólne kryteria analizy CV kursantów.</p>
    <form onSubmit={onSubmit} className="school-form">
      <label>Nazwa grupy<input ref={nameRef} name="name" required maxLength={120} placeholder="np. Frontend · jesień 2026" autoComplete="off" disabled={busy}/></label>
      <SchoolSelect label="Rola docelowa" name="role" disabled={busy} options={roleOptions}/>
      <SchoolSelect label="Etap kariery" name="seniority" disabled={busy} options={stageOptions}/>
      {error ? <p role="alert" className="school-error">{error}</p> : null}
      <div className="school-create-actions">
        <button type="button" disabled={busy} onClick={onCancel}>Anuluj</button>
        <button type="submit" className="button" disabled={busy}>{busy ? "Tworzenie grupy…" : "Utwórz grupę"}</button>
      </div>
    </form>
  </dialog>;
}
