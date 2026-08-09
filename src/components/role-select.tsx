"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { TARGET_ROLES, getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";

type RoleSelectProps = {
  value: TargetRoleId;
  onChange: (value: TargetRoleId) => void;
  disabled?: boolean;
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

export function RoleSelect({ value, onChange, disabled = false }: RoleSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const selectedIndex = TARGET_ROLES.findIndex((role) => role.id === value);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = getTargetRoleProfile(value);

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
    const role = TARGET_ROLES[index];
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
      setActiveIndex((current) => (current + direction + TARGET_ROLES.length) % TARGET_ROLES.length);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openAt(event.key === "Home" ? 0 : TARGET_ROLES.length - 1);
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
    <span className="role-label" id={labelId}>Rola docelowa</span>
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
        <div className="role-select-intro"><b>Wybierz specjalizację</b><span>Kryteria raportu dopasują się do roli.</span></div>
        <ul id={listboxId} className="role-options" role="listbox" aria-labelledby={labelId}>
          {TARGET_ROLES.map((role, index) => <li key={role.id} role="presentation">
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
    <small className="role-helper">Raport użyje kryteriów właściwych dla tej specjalizacji.</small>
  </div>;
}
