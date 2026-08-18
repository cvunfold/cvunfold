import type { Locale } from "@/lib/i18n";

type ScoreRingProps = {
  score: number;
  compact?: boolean;
  ariaLabel?: string;
  locale?: Locale;
  statusLabel?: string;
};

// Bands follow the prompt's own score calibration, so the ring cannot tell the
// reader something the report contradicts. Wording stays about the document, not
// the person, which is the same boundary the report itself keeps.
const BANDS = [
  { min: 85, tone: "strong", pl: "Mocny dokument", en: "Strong document" },
  { min: 70, tone: "good", pl: "Dobry kierunek", en: "Good direction" },
  { min: 55, tone: "mixed", pl: "Wymaga dopracowania", en: "Needs work" },
  { min: 40, tone: "weak", pl: "Dużo do poprawy", en: "Substantial gaps" },
  { min: 0, tone: "critical", pl: "Dokument nie broni poziomu", en: "Does not support the level" },
] as const;

export function scoreBand(score: number) {
  return BANDS.find((band) => score >= band.min) ?? BANDS[BANDS.length - 1];
}

export function ScoreRing({
  score,
  compact = false,
  locale = "pl",
  ariaLabel = `Wynik ${score} na 100`,
  statusLabel,
}: ScoreRingProps) {
  const band = scoreBand(score);
  const style = { "--score": `${score * 3.6}deg` } as React.CSSProperties;
  return <div className={`score-ring${compact ? " compact" : ""} tone-${band.tone}`} style={style} aria-label={ariaLabel}>
    <div><strong>{score}</strong><span>/100</span><small>{statusLabel ?? (locale === "en" ? band.en : band.pl)}</small></div>
  </div>;
}
