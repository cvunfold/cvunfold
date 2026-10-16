"use client";

import { useId, useRef, type ChangeEvent, type RefObject } from "react";
import { FileUp } from "lucide-react";

export function FilePicker({ label, files, onChange, disabled, multiple, inputRef, locale = "pl", accept, formatLabel = "PDF / DOCX" }: {
  label: string; files: File[]; onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; multiple?: boolean; inputRef?: RefObject<HTMLInputElement | null>; locale?: "pl" | "en";
  accept?: string; formatLabel?: string;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  const id = useId();
  return <div className="app-file-picker">
    <span id={`${id}-label`} className="app-field-label">{label}</span>
    <input id={id} ref={ref} hidden type="file" accept={accept || ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
      multiple={multiple} disabled={disabled} aria-labelledby={`${id}-label`} onChange={onChange}/>
    <button className="app-file-trigger" type="button" disabled={disabled} aria-labelledby={`${id}-label ${id}-action`} aria-describedby={`${id}-files`} onClick={() => ref.current?.click()}>
      <FileUp aria-hidden="true"/><span><b id={`${id}-action`}>{locale === "pl" ? (files.length ? (multiple ? "Zmień pliki" : "Zmień plik") : (multiple ? "Wybierz pliki" : "Wybierz plik")) : (files.length ? (multiple ? "Change files" : "Change file") : (multiple ? "Choose files" : "Choose file"))}</b><small>{formatLabel}</small></span>
    </button>
    <span id={`${id}-files`} className="app-file-status" role="status">{files.length ? files.map(file => file.name).join(", ") : (locale === "pl" ? "Nie wybrano pliku" : "No file selected")}</span>
  </div>;
}
