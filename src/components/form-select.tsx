"use client";

import { useState } from "react";
import { PopoverSelect } from "@/components/popover-select";

export function FormSelect({ label, name, value, defaultValue, options, onChange, disabled, required, locale = "pl" }: {
  label: string; name?: string; value?: string; defaultValue?: string;
  options: { id: string; label: string }[]; onChange?: (value: string) => void;
  disabled?: boolean; required?: boolean; locale?: "pl" | "en";
}) {
  const [localValue, setLocalValue] = useState(defaultValue ?? options[0]?.id ?? "");
  const selected = value ?? (options.some(option => option.id === localValue) ? localValue : options[0]?.id ?? "");
  return <div className="app-select">
    {name ? <input type="hidden" name={name} value={selected} disabled={disabled}/> : null}
    <PopoverSelect label={label} value={selected} options={options.map(option => ({ ...option, mark: "" }))}
      placeholder={locale === "pl" ? "Wybierz odpowiedź" : "Choose an answer"} required={required} disabled={disabled}
      onChange={next => { setLocalValue(next); onChange?.(next); }} columns={1}
      popoverTitle={label} popoverSubtitle={locale === "pl" ? "Wybierz z listy" : "Choose from the list"}/>
  </div>;
}
