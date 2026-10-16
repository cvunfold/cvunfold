"use client";

import { useState } from "react";
import { PopoverSelect, type PopoverSelectOption } from "@/components/popover-select";

export function SchoolSelect({ label, value, options, onChange, disabled, name, className = "" }: {
  label: string; value?: string; options: PopoverSelectOption<string>[]; onChange?: (value: string) => void;
  disabled?: boolean; name?: string; className?: string;
}) {
  const [localValue, setLocalValue] = useState(options[0]?.id || "");
  const selected = value ?? localValue;
  return <div className={`school-select ${className}`}>
    {name ? <input type="hidden" name={name} value={selected} disabled={disabled}/> : null}
    <PopoverSelect label={label} value={selected} options={options} onChange={next => { setLocalValue(next); onChange?.(next); }} disabled={disabled} columns={1} popoverTitle={label} popoverSubtitle="Wybierz z listy"/>
  </div>;
}
