"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Mail, Phone } from "lucide-react";
import { readSchoolContact, type SchoolContact } from "@/lib/schools/contact";

function ContactAction({ kind, value, href, name, onPrepareEmail }: { onPrepareEmail?: (email: string) => void; kind: "email" | "phone"; value: string; href: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const label = kind === "email" ? "E-mail" : "Telefon";
  const Icon = kind === "email" ? Mail : Phone;

  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const bounds = panel.current.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(anchor.left, window.innerWidth - bounds.width - 12)),
      top: Math.max(12, anchor.bottom + bounds.height + 8 < window.innerHeight ? anchor.bottom + 8 : anchor.top - bounds.height - 8),
    });
    panel.current.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
    function dismiss() { setOpen(false); }
    function reposition() {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const bounds = panel.current.getBoundingClientRect();
      if (anchor.bottom < 0 || anchor.top > window.innerHeight) { setOpen(false); return; }
      setPosition({
        left: Math.max(12, Math.min(anchor.left, window.innerWidth - bounds.width - 12)),
        top: Math.max(12, anchor.bottom + bounds.height + 8 < window.innerHeight ? anchor.bottom + 8 : anchor.top - bounds.height - 8),
      });
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Skopiowano");
    } catch {
      setStatus("Nie udało się skopiować. Zaznacz i skopiuj dane ręcznie.");
    }
  }

  return <>
    <button ref={trigger} type="button" className="school-contact-icon" aria-label={`${label}: ${name}`} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? id : undefined} onClick={() => { setStatus(""); setOpen(!open); }}><Icon size={16} aria-hidden="true"/></button>
    {open ? createPortal(<div ref={panel} id={id} role="dialog" aria-label={`${label}: ${name}`} className="school-contact-popover" style={position}>
      <span className="school-contact-kind">{label}</span><p className="school-contact-value">{value}</p>
      <div className="school-contact-buttons"><a href={href}><Icon size={15} aria-hidden="true"/>{kind === "email" ? "Wyślij" : "Zadzwoń"}</a><button type="button" onClick={() => void copy()}><Copy size={15} aria-hidden="true"/>Skopiuj</button></div>
      {kind === "email" && onPrepareEmail ? <button type="button" className="school-contact-prepare" onClick={() => { setOpen(false); onPrepareEmail(value); }}>Przygotuj mail z poprawkami <span aria-hidden="true">→</span></button> : null}
      <span role="status" className="school-contact-status">{status}</span>
    </div>, document.body) : null}
  </>;
}

export function ContactActions({ contact, name, onPrepareEmail }: { contact?: SchoolContact; name: string; onPrepareEmail?: (email: string) => void }) {
  const safe = readSchoolContact(contact);
  if (!safe || (!safe.emails.length && !safe.phones.length)) return <span className="school-contact-missing">Brak danych kontaktowych</span>;
  return <span className="school-contact-icons">{safe.emails.map(email => <ContactAction key={email} name={name} kind="email" onPrepareEmail={onPrepareEmail} value={email} href={`mailto:${encodeURIComponent(email)}`}/>)}{safe.phones.map(phone => <ContactAction key={phone.number} name={name} kind="phone" value={phone.label} href={`tel:${phone.number}`}/>)}</span>;
}
