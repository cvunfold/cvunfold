"use client";

import { SchoolSelect } from "./school-select";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { CVReport } from "@/lib/ai/schemas/report";
import { readSchoolContact } from "@/lib/schools/contact";
import type { SchoolStudent } from "@/lib/schools/model";
import { buildFeedbackDraft } from "@/lib/schools/feedback-draft";

export function FeedbackComposer({ student, schoolName, report, activation }: { student: SchoolStudent; schoolName: string; report: CVReport; activation?: { request: number; email: string } }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [copyError, setCopyError] = useState("");
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const lastActivation = useRef<number | null>(null);
  const draft = buildFeedbackDraft(student.name, schoolName, report);
  const contacts = readSchoolContact(student.contact);
  const [recipient, setRecipient] = useState(contacts?.emails[0] || "");

  const activationEmail = activation && contacts?.emails.includes(activation.email) ? activation.email : undefined;
  useEffect(() => {
    if (!activation) return;
    setOpen(true);
    if (activationEmail) setRecipient(activationEmail);
  }, [activation, activationEmail]);
  useEffect(() => {
    if (!activation || !open || lastActivation.current === activation.request) return;
    lastActivation.current = activation.request;
    section.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    section.current?.focus({ preventScroll: true });
  }, [activation, open]);

  function acceptOnTab(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, value: string, suggestion: string, setValue: (value: string) => void) {
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && value === "") {
      event.preventDefault();
      setValue(suggestion); setStatus(""); setCopyError("");
    }
  }
  async function copy(value: string, message: string) {
    setStatus(""); setCopyError("");
    try { await navigator.clipboard.writeText(value); setStatus(message); }
    catch { setCopyError("Nie udało się skopiować. Zaznacz treść i skopiuj ją ręcznie."); }
  }
  return <section ref={section} tabIndex={-1} className="school-card school-feedback" aria-label="Feedback do skopiowania">
    <div className="school-heading"><div><h2>Mail z feedbackiem</h2><p className="school-muted">Przygotuj wiadomość i wklej ją do swojej poczty.</p></div><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? "Zwiń edytor" : "Przygotuj mail"}</button></div>
    {open ? <div id={id}>
      <p className="school-feedback-note">Szary tekst to sugestia. W pustym polu naciśnij Tab, aby ją wstawić i edytować. Kolejny Tab przechodzi dalej. Możesz też użyć przycisku „Wstaw sugestię”.</p>
      {contacts?.emails.length ? <SchoolSelect className="school-feedback-label" label="Adresat" value={recipient} onChange={setRecipient} options={contacts.emails.map(email => ({ id: email, label: email, mark: "@" }))}/> : <p className="school-muted">CV nie zawiera odczytanego adresu e-mail. Dodaj adresata w swojej poczcie.</p>}
      <div className="school-feedback-field"><label htmlFor={`${id}-subject`}>Temat</label><input id={`${id}-subject`} value={subject} placeholder={draft.subject} aria-describedby={`${id}-hint`} onChange={e => { setSubject(e.target.value); setStatus(""); }} onKeyDown={e => acceptOnTab(e, subject, draft.subject, setSubject)}/><div className="school-actions"><button type="button" disabled={subject !== ""} onClick={() => setSubject(draft.subject)}>Wstaw sugestię tematu</button><button type="button" disabled={!subject.trim()} onClick={() => void copy(subject, "Skopiowano temat.")}>Kopiuj temat</button></div></div>
      <div className="school-feedback-field"><label htmlFor={`${id}-body`}>Treść maila</label><textarea id={`${id}-body`} rows={16} value={body} placeholder={draft.body} aria-describedby={`${id}-hint`} onChange={e => { setBody(e.target.value); setStatus(""); }} onKeyDown={e => acceptOnTab(e, body, draft.body, setBody)}/><div className="school-actions"><button type="button" disabled={body !== ""} onClick={() => setBody(draft.body)}>Wstaw sugestię treści</button><button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "Ukryj podgląd" : "Podgląd maila"}</button></div></div>
      <p id={`${id}-hint`} className="school-muted">Po wyczyszczeniu pola sugestia pojawi się ponownie. Sprawdź treść przed przekazaniem kursantowi.</p>
      {preview ? <div className="school-feedback-preview" aria-label="Podgląd maila"><h3>Podgląd wiadomości</h3><p><strong>Do:</strong> {recipient || "Uzupełnij adresata w poczcie"}</p><p><strong>Temat:</strong> {subject || "Temat jest pusty"}</p><div className="school-feedback-text">{body || "Treść jest pusta. Wstaw sugestię lub napisz wiadomość."}</div></div> : null}
      <div className="school-actions"><button type="button" className="button" disabled={!body.trim()} onClick={() => void copy(body, "Skopiowano treść maila. Wklej ją do swojej poczty.")}>Kopiuj mail</button>{recipient ? <button type="button" onClick={() => void copy(recipient, "Skopiowano adres e-mail.")}>Kopiuj adres</button> : null}</div>
      {recipient ? <a className="school-feedback-email" href={`mailto:${encodeURIComponent(recipient)}`}>{recipient}</a> : null}
      <p className="school-muted">„Kopiuj mail” kopiuje samą treść. Temat i adres możesz skopiować osobno. Wiadomość wyślesz ze swojej poczty.</p>
      {status ? <p role="status">{status}</p> : null}{copyError ? <p role="alert" className="school-error">{copyError}</p> : null}
    </div> : null}
  </section>;
}
