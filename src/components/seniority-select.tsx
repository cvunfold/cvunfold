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

const MARK: Record<Seniority, string> = { first_job: "IT", auto: "?", junior: "JR", mid: "MD", senior: "SR", lead: "LD" };

const GRID_ORDER: Seniority[] = ["first_job", "senior", "junior", "lead", "mid", "auto"];

export function SenioritySelect({ value, onChange, levels, label, optionalHint, popoverTitle, popoverSubtitle, disabled = false }: SenioritySelectProps) {
  const options = GRID_ORDER.map((id) => {
    const level = levels.find(([levelId]) => levelId === id);
    return { id, mark: MARK[id], label: level?.[1] ?? id };
  });
  return <PopoverSelect
    label={<>{label} <span className="role-label-optional">({optionalHint})</span></>}
    value={value}
    // Same two-up grid as the role field, so five options take two short rows
    // instead of five, matching the height saving the role field already gets.
    columns={2}
    options={options}
    onChange={onChange}
    disabled={disabled}
    popoverTitle={popoverTitle}
    popoverSubtitle={popoverSubtitle}
  />;
}
