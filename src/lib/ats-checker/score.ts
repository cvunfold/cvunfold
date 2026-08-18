import type { AtsCheckItem } from "./types";

const STATUS_VALUE: Record<AtsCheckItem["status"], number | null> = {
  pass: 1,
  warning: 0.5,
  fail: 0,
  not_applicable: null,
};

/** Equal-weighted average over checks that apply, 0-100. A document where every applicable check passes scores 100 regardless of how many checks were not_applicable. */
export function computeAtsScore(checks: AtsCheckItem[]): number {
  const applicable = checks.map((check) => STATUS_VALUE[check.status]).filter((value): value is number => value !== null);
  if (applicable.length === 0) return 100;
  return Math.round((applicable.reduce((sum, value) => sum + value, 0) / applicable.length) * 100);
}
