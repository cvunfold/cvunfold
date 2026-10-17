// The evidence predicates and the missing-information baseline stay unchanged.
// Five satisfied predicates now fill the advertised 100-point scale.
export const EVIDENCE_SCORE_BASE = 20;
export const EVIDENCE_SCORE_STEP = 16;
export const EVIDENCE_SIGNAL_COUNT = 5;
export const SCORE_SCALE_RUBRIC_VERSION = "technical-v2.2.0";

export const LEGACY_SCORE_THRESHOLDS = {
  strong: 76, provisional: 40,
  importantCap: 79, criticalCap: 65,
  schoolRefinement: 60, schoolMinor: 80,
} as const;

// Transform the former 20..90 scale into 20..100, including severity caps
// and interpretation boundaries. Round once to the integer report scale.
export function rescaleLegacyEvidenceScore(score: number): number {
  return Math.round(EVIDENCE_SCORE_BASE + (score - EVIDENCE_SCORE_BASE) * EVIDENCE_SCORE_STEP / 14);
}

export const SCORE_THRESHOLDS = Object.fromEntries(
  Object.entries(LEGACY_SCORE_THRESHOLDS).map(([key, value]) => [key, rescaleLegacyEvidenceScore(value)]),
) as { [K in keyof typeof LEGACY_SCORE_THRESHOLDS]: number };

export function usesFullEvidenceScale(rubricVersion?: string): boolean {
  const version = /^technical-v(\d+)\.(\d+)\./.exec(rubricVersion || "");
  return version !== null && (Number(version[1]) > 2 || (Number(version[1]) === 2 && Number(version[2]) >= 2));
}

export function getScoreThresholds(rubricVersion?: string) {
  return usesFullEvidenceScale(rubricVersion) ? SCORE_THRESHOLDS : LEGACY_SCORE_THRESHOLDS;
}

// Keep evaluation tolerances in their original evidence units. A single signal
// moving by 16 new points must have the same tolerance as 14 legacy points.
export function toLegacyEvidenceUnits(score: number, rubricVersion?: string): number {
  return usesFullEvidenceScale(rubricVersion) ? EVIDENCE_SCORE_BASE + (score - EVIDENCE_SCORE_BASE) * 14 / EVIDENCE_SCORE_STEP : score;
}

export function scoreEvidenceSignals(count: number): number {
  if (!Number.isInteger(count) || count < 0 || count > EVIDENCE_SIGNAL_COUNT) throw new Error("INVALID_SIGNAL_COUNT");
  return EVIDENCE_SCORE_BASE + EVIDENCE_SCORE_STEP * count;
}
