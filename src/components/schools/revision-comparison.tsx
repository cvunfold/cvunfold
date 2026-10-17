import { AnimatedDetails } from "@/components/animated-details";
import type { SchoolStudent } from "@/lib/schools/model";
import { SchoolQuote } from "./school-quote";

export function SchoolRevisionComparison({ sample }: { sample: NonNullable<SchoolStudent["sample"]> }) {
  const revision = sample.revision;
  const pair = revision?.analysis;
  if (!revision || !pair) return null;
  const before = pair.before.summary.overallScore, after = pair.after.summary.overallScore;
  const delta = after - before;
  return <section className="school-card school-demo-revision">
    <header className="school-revision-heading"><span className="school-eyebrow">Ten sam kursant · dwie wersje CV</span><h2>Co zmieniło się po poprawkach?</h2></header>
    <div className="school-progress school-revision-score">
      <div><strong><span className="school-score-before">{before}/100</span>{" → "}<span className="school-score-after">{after}/100</span></strong><small>Wynik pierwszej i poprawionej wersji</small></div>
      <div className="school-revision-gain"><b>{delta > 0 ? "+" : ""}{delta}</b><span>punktów</span></div>
    </div>
    <p className="school-revision-lead">Jakość komunikacji dokumentu. Poprawka opisuje fakty ujawnione w odpowiedziach, bez dodawania nowego doświadczenia.</p>
    {revision.redaction?.note ? <p className="school-gap-note">{revision.redaction.note}</p> : null}
    <div className="school-demo-comparison school-verdict-comparison">
      <div><span className="school-comparison-stage">Pierwsza wersja</span><h3>Werdykt przed</h3><p>{pair.before.summary.oneSentenceVerdict}</p><h4>Uwagi przed</h4><ul>{pair.before.issues.map(issue => <li key={issue.id}>{issue.title}</li>)}</ul></div>
      <div><span className="school-comparison-stage">Po poprawkach</span><h3>Werdykt po</h3><p>{pair.after.summary.oneSentenceVerdict}</p><h4>Uwagi po</h4>{pair.after.issues.length ? <ul>{pair.after.issues.map(issue => <li key={issue.id}>{issue.title}</li>)}</ul> : <p className="school-no-findings">Brak osobnych uwag w tej analizie.</p>}</div>
    </div>
    {revision.conversation ? <AnimatedDetails className="school-demo-conversation"><summary>Jak powstała poprawka: pytania i odpowiedzi</summary>
      <p>{revision.process === "guided_self_edit" ? "Fikcyjny przykład. Fakty ustaliliśmy przed pierwszą analizą. Pytania przygotował panel na podstawie pierwszego raportu. Odpowiedzi pochodzą wyłącznie z tego rejestru. Symulując kursanta, samodzielnie poprawiliśmy opis według rad; nie używaliśmy gotowego prompta do przepisywania CV." : "Fikcyjny przykład. Fakty ustaliliśmy przed pierwszą analizą. Odpowiedzi symulują kursantkę i pochodzą wyłącznie z tego rejestru. To historyczny przykład poprawki przygotowanej z pomocą AI. Obecnie panel zachowuje pytania i rady, a treść CV poprawia sam kursant."}</p>
      {revision.conversation.some(item => item.displayAnswer) ? <p className="school-muted">Powtarzające się fragmenty odpowiedzi pokazujemy tylko raz, bez zmiany faktów.</p> : null}
      {revision.conversation.map((item, index) => <article key={item.issueId}><h3>{index + 1}. {item.question}</h3><p className="school-muted">Zalecenie z pierwszego raportu: {item.recommendation}</p><SchoolQuote>{item.displayAnswer ?? item.answer}</SchoolQuote></article>)}
    </AnimatedDetails> : null}
    {revision.changes.map(change => <article className="school-finding school-cv-change" key={change.title}><h3>{change.title}</h3><div className="school-demo-comparison"><div><h4>Przed</h4><SchoolQuote formatted>{change.before}</SchoolQuote></div><div><h4>Po</h4><SchoolQuote formatted>{change.after}</SchoolQuote></div></div><p className="school-muted">{change.note}</p></article>)}
    <AnimatedDetails className="school-revision-method"><summary>O analizie i porównaniu wersji</summary>
      <p>Oba PDF-y przeanalizowaliśmy na nowo tym samym modelem, promptem i kryteriami. Wyniki są zapisanymi rezultatami analizy, bez ręcznego korygowania ocen.</p>
      {revision.redaction?.partial ? <p>Po odpowiedziach przygotowaliśmy częściową poprawkę opisu. Nie uwzględnia ona wszystkich ujawnionych faktów. Ten PDF przeanalizowaliśmy raz, bez ręcznej korekty ocen.</p> : revision.redaction ? <p>Wersję po odpowiedziach dodatkowo skróciliśmy redakcyjnie z {revision.redaction.oldProjectWords} do {revision.redaction.newProjectWords} słów w opisie projektu. Pokazujemy nową analizę tego krótszego PDF-a, bez ręcznej korekty ocen.{revision.redaction.technicalRetry ? " Pierwsza próba nie dała poprawnego technicznie raportu; ponowiono tylko tę analizę na tym samym pliku." : ""}</p> : null}
      <p>Dwie analizy nie są gwarancją powtarzalności modelu. Pełny raport wybranej wersji znajduje się w sekcjach powyżej.</p>
    </AnimatedDetails>
  </section>;
}
