type ScoreRingProps = {
  score: number;
  compact?: boolean;
  ariaLabel?: string;
  statusLabel?: string;
};

export function ScoreRing({
  score,
  compact = false,
  ariaLabel = `Wynik ${score} na 100`,
  statusLabel = "Dobry kierunek",
}: ScoreRingProps) {
  const style = { "--score": `${score * 3.6}deg` } as React.CSSProperties;
  return <div className={compact ? "score-ring compact" : "score-ring"} style={style} aria-label={ariaLabel}>
    <div><strong>{score}</strong><span>/100</span><small>{statusLabel}</small></div>
  </div>;
}
