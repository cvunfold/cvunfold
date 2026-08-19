"use client";

import { PopoverSelect } from "@/components/popover-select";
import type { Seniority } from "@/lib/rubrics/technical-v1";

type SenioritySelectProps = {
  value: Seniority;
  onChange: (value: Seniority) => void;
  /** [value, label] pairs, already localized by the caller. */
  levels: readonly (readonly [Seniority, string])[];
  label: string;
  optionalHint: string;
  popoverTitle: string;
  popoverSubtitle: string;
  disabled?: boolean;
};

const MARK: Record<Seniority, string> = { auto: "?", junior: "JR", mid: "MD", senior: "SR", lead: "LD" };

export function SenioritySelect({ value, onChange, levels, label, optionalHint, popoverTitle, popoverSubtitle, disabled = false }: SenioritySelectProps) {
  return <PopoverSelect
    label={<>{label} <span className="role-label-optional">{optionalHint}</span></>}
    value={value}
    // Bare words, no per-option description, so one column reads better than
    // two-up cells with nothing to fill the second line.
    columns={1}
    options={levels.map(([id, optionLabel]) => ({ id, mark: MARK[id], label: optionLabel }))}
    onChange={onChange}
    disabled={disabled}
    popoverTitle={popoverTitle}
    popoverSubtitle={popoverSubtitle}
  />;
}
