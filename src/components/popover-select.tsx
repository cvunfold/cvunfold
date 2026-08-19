"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// Shared shell behind every dropdown-style field on the analysis form: a
// combobox trigger and a listbox popover that closes on pick. Extracted once
// role and seniority both needed to look and behave the same way — a single
// implementation is what keeps that true as either one changes.

export type PopoverSelectOption<T extends string> = { id: T; mark: string; label: string; description?: string };

type PopoverSelectProps<T extends string> = {
  label: ReactNode;
  value: T;
  options: PopoverSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  popoverTitle: string;
  popoverSubtitle: string;
  /** 2 for options with a description worth two columns of width, 1 for bare labels. */
  columns?: 1 | 2;
  helper?: ReactNode;
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

export function PopoverSelect<T extends string>({
  label, value, options, onChange, disabled = false, popoverTitle, popoverSubtitle, columns = 2, helper,
}: PopoverSelectProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.id === value);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex] ?? options[0];

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
    const option = options[index];
    if (!option) return;
    onChange(option.id);
    setActiveIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (!open) return openAt(selectedIndex);
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openAt(event.key === "Home" ? 0 : options.length - 1);
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

  if (!selected) return null;

  return <div className="role-field" ref={rootRef}>
    <span className="role-label" id={labelId}>{label}</span>
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
        <span className="role-select-mark" aria-hidden="true">{selected.mark}</span>
        <span className="role-select-copy"><b>{selected.label}</b>{selected.description ? <small>{selected.description}</small> : null}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? <div className="role-select-popover">
        <div className="role-select-intro"><b>{popoverTitle}</b><span>{popoverSubtitle}</span></div>
        <ul id={listboxId} className="role-options" role="listbox" aria-labelledby={labelId} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {options.map((option, index) => <li key={option.id} role="presentation">
            <button
              id={`${listboxId}-${index}`}
              type="button"
              className={`${index === activeIndex ? "active " : ""}${option.id === value ? "selected" : ""}`}
              role="option"
              aria-selected={option.id === value}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => select(index)}
            >
              <span className="role-option-mark" aria-hidden="true">{option.mark}</span>
              <span><b>{option.label}</b>{option.description ? <small>{option.description}</small> : null}</span>
              {option.id === value ? <SelectedIcon /> : null}
            </button>
          </li>)}
        </ul>
      </div> : null}
    </div>
    {helper}
  </div>;
}
