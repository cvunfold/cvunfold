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

// The grid fills row-major (left-to-right, then wraps), so to read as two
// columns top-to-bottom — auto/junior/mid on the left, senior/lead on the
// right — the array itself has to interleave them in that order.
const GRID_ORDER: Seniority[] = ["auto", "senior", "junior", "lead", "mid"];

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
