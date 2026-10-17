import type { Locale } from "@/lib/i18n";

export function RevisionGuidance({ locale }: { locale: Locale }) {
  const pl = locale === "pl";
  const steps = pl ? [
    ["Ustal fakty", "Przejrzyj wskazane fragmenty CV i konkretne rady. Ustal, co zrobiłeś samodzielnie, jakie wsparcie otrzymałeś i co możesz potwierdzić. Jeśli nie pamiętasz, najpierw to sprawdź."],
    ["Popraw własnymi słowami", "Samodzielnie doprecyzuj opis zgodnie z zaleceniami. Dodaj tylko prawdziwe informacje. Jeśli rada dotyczy działania, którego nie wykonałeś, najpierw je wykonaj, zamiast dopisywać je do CV."],
    ["Sprawdź nową wersję", "Przeczytaj całe CV, zapisz poprawiony PDF lub DOCX i prześlij go do ponownej analizy. Porównaj uwagi i dowody, a także ocenę."],
  ] : [
    ["Establish the facts", "Review the cited CV passages and specific advice. Identify your own work, the support you received and what you can confirm. Check anything you cannot remember."],
    ["Revise in your own words", "Clarify the description yourself using the recommendations. Include only true information. If the advice concerns something you have not done, do it before adding it to your CV."],
    ["Recheck the new version", "Read the whole CV, save the revised PDF or DOCX and upload it for another analysis. Compare findings and evidence as well as the score."],
  ];
  return <section id="section:revision" className="report-section revision-brief" aria-labelledby="revision-brief-title">
    <div className="revision-brief-heading">
      <span className="revision-brief-eyebrow">{pl ? "OD RAPORTU DO POPRAWEK" : "FROM REPORT TO REVISION"}</span>
      <h2 id="revision-brief-title">{pl ? "Jak samodzielnie poprawić CV" : "How to revise your CV"}</h2>
      <p>{pl ? "Raport wskazuje, co warto wyjaśnić i poprawić. Ty wybierasz treść i odpowiadasz za zgodność opisu z faktami." : "The report identifies what to clarify and improve. You choose the wording and are responsible for its accuracy."}</p>
    </div>
    <ol className="revision-brief-steps">{steps.map(([title, description], index) => <li key={title}><span aria-hidden="true">0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol>
    <p className="revision-brief-privacy">{pl ? "Poprawa opisu nie gwarantuje wzrostu oceny. Ocena zależy od informacji widocznych w nowej wersji dokumentu." : "A clearer description does not guarantee a higher score. The score depends on the information shown in the new document."}</p>
  </section>;
}
