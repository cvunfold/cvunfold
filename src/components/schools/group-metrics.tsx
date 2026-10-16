import { ArrowRight } from "lucide-react";
import type { summarizeSchool } from "@/lib/schools/model";

export function SchoolGroupMetrics({ summary }: { summary: ReturnType<typeof summarizeSchool> }) {
  const metrics = [
    { label: "Średnia ocena CV", current: summary.average, original: summary.baseline?.average, caption: "Jakość dokumentu · skala 0–100" },
    { label: "CV z drugą analizą", current: summary.secondAnalysisCount, original: undefined, total: summary.count, caption: "Ponownie przeanalizowane CV · w grupie" },
    { label: "Średnia liczba ważnych problemów", current: summary.averageImportantIssues, original: summary.baseline?.averageImportantIssues, caption: "Ważne i krytyczne · na CV" },
  ];
  const format = (value: number | null) => value?.toLocaleString("pl-PL", { maximumFractionDigits: 1 }) ?? "Brak danych";
  return <>
    <div className="school-stats school-group-metrics">{metrics.map(metric => <div className={`school-card${metric.total !== undefined ? " school-metric-count-card" : ""}`} role="group" aria-label={metric.label} key={metric.label}>
      <span>{metric.label}</span>
      {metric.original !== undefined ? <div className="school-metric-pair">
        <div className="school-metric-original"><small>Początkowo</small><strong>{format(metric.original)}</strong></div>
        <ArrowRight size={18} aria-hidden="true"/>
        <div className="school-metric-current"><small>Teraz</small><strong>{format(metric.current)}</strong></div>
      </div> : <strong>{format(metric.current)}{metric.total !== undefined ? <span className="school-metric-total"> z {metric.total}</span> : null}</strong>}
      <small>{metric.caption}</small>
    </div>)}</div>
    {summary.baseline ? <p className="school-metrics-note">Porównanie tej samej grupy {summary.baseline.count} osób. Początkowo: pierwsze CV każdej osoby. Teraz: jej najnowszy dostępny raport.</p> : null}
  </>;
}
