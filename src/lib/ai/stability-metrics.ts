import { RUBRIC_CATEGORY_KEYS } from "./schemas/report";
import type { RubricCategoryKey } from "./schemas/report";
import { toLegacyEvidenceUnits } from "@/lib/rubrics/score-scale";

export type ScoreObservation = {
  id: string; locale: "pl" | "en"; repeat: number; score: number;
  categories: Record<RubricCategoryKey, number>; decision: string; level: string;
  rubricVersion?: string;
};
const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
export function summarizeScoreStability(rows: ScoreObservation[], expectedRepeats = 3) {
  const ids = [...new Set(rows.map(row => row.id))];
  const withinLanguage = ids.flatMap(id => (["pl", "en"] as const).map(locale => {
    const samples = rows.filter(row => row.id === id && row.locale === locale).sort((a, b) => a.repeat - b.repeat);
    const complete = samples.length === expectedRepeats && new Set(samples.map(row => row.repeat)).size === expectedRepeats;
    const overallSpread = samples.length ? spread(samples.map(row => row.score)) : null;
    const categorySpreads = Object.fromEntries(RUBRIC_CATEGORY_KEYS.map(key => [key, samples.length ? spread(samples.map(row => row.categories[key])) : null]));
    const evidenceUnitSpread = samples.length ? spread(samples.map(row => toLegacyEvidenceUnits(row.score, row.rubricVersion))) : null;
    const evidenceUnitCategorySpreads = Object.fromEntries(RUBRIC_CATEGORY_KEYS.map(key => [key, samples.length ? spread(samples.map(row => toLegacyEvidenceUnits(row.categories[key], row.rubricVersion))) : null]));
    return { id, locale, scores: samples.map(row => row.score), complete, overallSpread, categorySpreads, evidenceUnitSpread, evidenceUnitCategorySpreads,
      pass: complete && evidenceUnitSpread !== null && evidenceUnitSpread <= 8
        && Object.values(evidenceUnitCategorySpreads).every(delta => delta !== null && delta <= 15)
        && new Set(samples.map(row => row.decision)).size === 1 && new Set(samples.map(row => row.level)).size === 1,
    };
  }));
  const paired = ids.flatMap(id => Array.from({ length: expectedRepeats }, (_, index) => {
    const repeat = index + 1;
    const pl = rows.find(row => row.id === id && row.locale === "pl" && row.repeat === repeat);
    const en = rows.find(row => row.id === id && row.locale === "en" && row.repeat === repeat);
    if (!pl || !en) return { id, repeat, complete: false, pass: false };
    const overallDelta = Math.abs(pl.score - en.score);
    const categoryDeltas = Object.fromEntries(RUBRIC_CATEGORY_KEYS.map(key => [key, Math.abs(pl.categories[key] - en.categories[key])]));
    const evidenceUnitDelta = Math.abs(toLegacyEvidenceUnits(pl.score, pl.rubricVersion) - toLegacyEvidenceUnits(en.score, en.rubricVersion));
    const evidenceUnitCategoryDeltas = Object.fromEntries(RUBRIC_CATEGORY_KEYS.map(key => [key, Math.abs(toLegacyEvidenceUnits(pl.categories[key], pl.rubricVersion) - toLegacyEvidenceUnits(en.categories[key], en.rubricVersion))]));
    return { id, repeat, complete: true, overallDelta, categoryDeltas, evidenceUnitDelta, evidenceUnitCategoryDeltas,
      pass: evidenceUnitDelta <= 8 && Object.values(evidenceUnitCategoryDeltas).every(delta => delta <= 15) && pl.decision === en.decision && pl.level === en.level,
    };
  }));
  return { reportCount: rows.length, expectedRepeats, withinLanguage, paired,
    withinLanguagePassed: withinLanguage.filter(group => group.pass).length,
    localePairsPassed: paired.filter(pair => pair.pass).length,
  };
}
