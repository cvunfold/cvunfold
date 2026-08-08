export function ScoreRing({ score, compact = false }: { score: number; compact?: boolean }) {
  const style = { "--score": `${score * 3.6}deg` } as React.CSSProperties;
  return <div className={compact ? "score-ring compact" : "score-ring"} style={style} aria-label={`Wynik ${score} na 100`}>
    <div><strong>{score}</strong><span>/100</span><small>Dobry kierunek</small></div>
  </div>;
}
