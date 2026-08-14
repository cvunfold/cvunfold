"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { getTargetRoleOptions, getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

type RoleSelectProps = {
  value: TargetRoleId;
  onChange: (value: TargetRoleId) => void;
  disabled?: boolean;
  locale: Locale;
};

function ChevronIcon({ open }: { open: boolean }) {
  return <svg className={open ? "role-select-chevron open" : "role-select-chevron"} viewBox="0 0 20 20" aria-hidden="true">
    <path d="m5 7.5 5 5 5-5" />
  </svg>;
}

function SelectedIcon() {
  return <svg className="role-option-check" viewBox="0 0 20 20" aria-hidden="true">
    <path d="m4.5 10.5 3.2 3.2 7.8-8" />
  </svg>;
}

export function RoleSelect({ value, onChange, disabled = false, locale }: RoleSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const roles = getTargetRoleOptions(locale);
  const selectedIndex = roles.findIndex((role) => role.id === value);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = getTargetRoleProfile(value, locale);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function select(index: number) {
    const role = roles[index];
    if (!role) return;
    onChange(role.id);
    setActiveIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (!open) return openAt(selectedIndex);
      setActiveIndex((current) => (current + direction + roles.length) % roles.length);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openAt(event.key === "Home" ? 0 : roles.length - 1);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      select(activeIndex);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return <div className="role-field" ref={rootRef}>
    <span className="role-label" id={labelId}>{locale === "pl" ? "Rola docelowa" : "Target role"}</span>
    <div className={open ? "role-select open" : "role-select"}>
      <button
        ref={triggerRef}
        type="button"
        className="role-select-trigger"
        role="combobox"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openAt(selectedIndex)}
        onKeyDown={handleKeyDown}
      >
        <span className="role-select-mark" aria-hidden="true">{selected.shortLabel}</span>
        <span className="role-select-copy"><b>{selected.label}</b><small>{selected.description}</small></span>
        <ChevronIcon open={open} />
      </button>
      {open ? <div className="role-select-popover">
        <div className="role-select-intro"><b>{locale === "pl" ? "Wybierz specjalizację" : "Choose a specialisation"}</b><span>{locale === "pl" ? "Kryteria raportu dopasują się do roli." : "The report criteria adapt to the role."}</span></div>
        <ul id={listboxId} className="role-options" role="listbox" aria-labelledby={labelId}>
          {roles.map((role, index) => <li key={role.id} role="presentation">
            <button
              id={`${listboxId}-${index}`}
              type="button"
              className={`${index === activeIndex ? "active " : ""}${role.id === value ? "selected" : ""}`}
              role="option"
              aria-selected={role.id === value}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => select(index)}
            >
              <span className="role-option-mark" aria-hidden="true">{role.shortLabel}</span>
              <span><b>{role.label}</b><small>{role.description}</small></span>
              {role.id === value ? <SelectedIcon /> : null}
            </button>
          </li>)}
        </ul>
      </div> : null}
    </div>
    {selected.experimental ? <small className="role-helper experimental" role="note">
      {locale === "pl"
        ? "Tryb eksperymentalny: analizę CV Unfold zoptymalizowaliśmy i przetestowaliśmy dla wymienionych ról IT. Dla pozostałych specjalizacji użyjemy kryteriów ogólnych, więc wynik może być mniej precyzyjny. Bezpłatny wynik wstępny zobaczysz przed zakupem."
        : "Experimental mode: we optimised and tested CV Unfold for the listed IT roles. Other specialisations use general criteria, so the result may be less precise. You will see the free initial result before purchase."}
    </small> : <small className="role-helper">{locale === "pl" ? "Raport użyje kryteriów właściwych dla tej specjalizacji." : "The report will use criteria specific to this specialisation."}</small>}
  </div>;
}
