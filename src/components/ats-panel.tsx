"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { AtsCheckResult, AtsCheckId, AtsCheckStatus } from "@/lib/ats-checker";
const copy = {
  pl: { atsTitle: "ATS / higiena techniczna dokumentu", atsCaption: "Czy plik da się poprawnie odczytać i sparsować. To nie jest ocena treści ani poziomu.", atsShowAll: "Pokaż wszystkie kontrole", atsCollapse: "Zwiń kontrole" },
  en: { atsTitle: "ATS / technical document hygiene", atsCaption: "Whether the file parses correctly. This is not an assessment of content or seniority.", atsShowAll: "Show all checks", atsCollapse: "Collapse checks" },
};
// One deterministic finding per check (@/lib/ats-checker), not model output, so
// the copy is fixed here rather than coming back with the report.
const ATS_CHECK_COPY: Record<Locale, Record<AtsCheckId, Record<Exclude<AtsCheckStatus, "not_applicable">, { title: string; caption: string }>>> = {
  pl: {
    text_layer: {
      pass: { title: "Dokument ma prawdziwą warstwę tekstową", caption: "Tekst da się poprawnie wyodrębnić z pliku, więc systemy ATS mogą go odczytać." },
      warning: { title: "Część stron może być zeskanowanym obrazem", caption: "Niektóre strony mają mało lub brak tekstu do wyodrębnienia." },
      fail: { title: "Dokument wygląda na zeskanowany obraz", caption: "Większość stron nie ma warstwy tekstowej, więc ATS prawdopodobnie nic nie odczyta." },
    },
    reading_order: {
      pass: { title: "Tekst wyciąga się w naturalnej kolejności", caption: "Kolejność odczytu odpowiada wizualnemu układowi dokumentu." },
      warning: { title: "Kolejność odczytu miejscami odbiega od układu", caption: "Część tekstu może pojawić się w nieoczekiwanym miejscu po wyodrębnieniu." },
      fail: { title: "Kolejność odczytu jest zaburzona", caption: "Tekst prawdopodobnie wyodrębni się w losowej kolejności, myląc systemy ATS." },
    },
    sections: {
      pass: { title: "Standardowe sekcje są rozpoznawalne", caption: "Doświadczenie, umiejętności i wykształcenie mają rozpoznawalne nagłówki." },
      warning: { title: "Część standardowych sekcji jest trudna do rozpoznania", caption: "Tylko część typowych nagłówków sekcji jest widoczna." },
      fail: { title: "Brak rozpoznawalnych standardowych sekcji", caption: "ATS może nie rozpoznać, gdzie zaczyna się doświadczenie, umiejętności czy wykształcenie." },
    },
    dates_titles: {
      pass: { title: "Stanowiska i daty są czytelne", caption: "Nazwy stanowisk i przedziały dat mają standardowy, rozpoznawalny zapis." },
      warning: { title: "Część stanowisk lub dat może być trudna do odczytania", caption: "Rozpoznano tylko część standardowych dat lub nazw stanowisk." },
      fail: { title: "Stanowiska i daty są trudne do odczytania", caption: "Nie znaleziono standardowych przedziałów dat ani nazw stanowisk." },
    },
    contact_info: {
      pass: { title: "Dane kontaktowe są parsowalne", caption: "Adres e-mail ma standardowy, rozpoznawalny format." },
      warning: { title: "Znaleziono tylko telefon, brak e-maila", caption: "ATS i rekruterzy zwykle oczekują też adresu e-mail." },
      fail: { title: "Nie znaleziono parsowalnych danych kontaktowych", caption: "Nie wykryto standardowego adresu e-mail ani numeru telefonu." },
    },
    layout_columns: {
      pass: { title: "Układ jednokolumnowy", caption: "Brak wykrytych kolumn ani tabel mogących rozbić kolejność tekstu." },
      warning: { title: "Wykryto układ wielokolumnowy", caption: "Kolumny lub tabele mogą sprawić, że ATS wymiesza tekst z różnych sekcji." },
      fail: { title: "Układ silnie utrudnia odczyt kolejności", caption: "Kolumny lub tabele prawdopodobnie rozbijają kolejność tekstu dla ATS." },
    },
    glyph_artifacts: {
      pass: { title: "Brak dziwnych znaków czy ikon zastępujących tekst", caption: "Nie wykryto artefaktów ekstrakcji ani znaków zastępczych." },
      warning: { title: "Wykryto pojedyncze nietypowe znaki", caption: "Może to być ikona czcionkowa zapisana jako niedrukowalny znak." },
      fail: { title: "Wykryto uszkodzone lub zastępcze znaki", caption: "Część tekstu mogła zamienić się w nieczytelne znaki podczas ekstrakcji." },
    },
    date_format: {
      pass: { title: "Zapis dat jest jednoznaczny", caption: "Daty używają formatu, który nie budzi wątpliwości interpretacyjnych." },
      warning: { title: "W dokumencie mieszają się różne formaty dat", caption: "Różne zapisy dat utrudniają automatyczne odczytanie chronologii." },
      fail: { title: "Część dat jest zapisana niejednoznacznie", caption: "Format dnia i miesiąca (np. 03/04/2021) można odczytać na dwa sposoby." },
    },
  },
  en: {
    text_layer: {
      pass: { title: "Real text layer detected", caption: "Text can be extracted from the file, so ATS systems can read it." },
      warning: { title: "Some pages may be scanned images", caption: "Some pages have little or no extractable text." },
      fail: { title: "Document looks like a scanned image", caption: "Most pages have no text layer, so an ATS will likely read nothing." },
    },
    reading_order: {
      pass: { title: "Text extracts in a natural order", caption: "Extraction order matches the document's visual layout." },
      warning: { title: "Reading order is slightly off in places", caption: "Some text may appear out of place once extracted." },
      fail: { title: "Reading order is scrambled", caption: "Text likely extracts in a jumbled order, confusing ATS systems." },
    },
    sections: {
      pass: { title: "Standard sections are recognizable", caption: "Experience, skills and education have recognizable headings." },
      warning: { title: "Some standard sections are hard to recognize", caption: "Only some typical section headings are visible." },
      fail: { title: "No recognizable standard sections", caption: "An ATS may not recognize where experience, skills or education begin." },
    },
    dates_titles: {
      pass: { title: "Job titles and dates are readable", caption: "Job titles and date ranges use a standard, recognizable format." },
      warning: { title: "Some titles or dates may be hard to parse", caption: "Only some standard dates or job titles were recognized." },
      fail: { title: "Job titles and dates are hard to parse", caption: "No standard date ranges or job titles were found." },
    },
    contact_info: {
      pass: { title: "Contact info is parsable", caption: "The email address is in a standard, recognizable format." },
      warning: { title: "Only a phone number was found, no email", caption: "ATS systems and recruiters usually expect an email address too." },
      fail: { title: "No parsable contact info found", caption: "No standard email address or phone number was detected." },
    },
    layout_columns: {
      pass: { title: "Single-column layout", caption: "No columns or tables detected that could break text order." },
      warning: { title: "Multi-column layout detected", caption: "Columns or tables may cause an ATS to interleave text from different sections." },
      fail: { title: "Layout severely disrupts reading order", caption: "Columns or tables likely break text order for an ATS." },
    },
    glyph_artifacts: {
      pass: { title: "No stray characters or icon glyphs", caption: "No extraction artifacts or replacement characters detected." },
      warning: { title: "A few unusual characters detected", caption: "This may be an icon-font glyph stored as a non-printable character." },
      fail: { title: "Corrupted or replacement characters detected", caption: "Some text may have turned into unreadable characters during extraction." },
    },
    date_format: {
      pass: { title: "Date notation is unambiguous", caption: "Dates use a format that leaves no room for misinterpretation." },
      warning: { title: "Multiple date formats are mixed", caption: "Mixed date formats make it harder to parse the timeline automatically." },
      fail: { title: "Some dates are notated ambiguously", caption: "A day/month format (e.g. 03/04/2021) can be read two different ways." },
    },
  },
};

const ATS_STATUS_CLASS: Record<Exclude<AtsCheckStatus, "not_applicable">, string> = { pass: "ats-positive", warning: "ats-warning", fail: "ats-error" };
// Warnings and failures are the actionable ones, so the collapsed preview leads
// with those instead of the first three checks in checker order.
const ATS_STATUS_PRIORITY: Record<Exclude<AtsCheckStatus, "not_applicable">, number> = { fail: 0, warning: 1, pass: 2 };
const ATS_PREVIEW_SIZE = 3;

/** Same panel in the free and paid report: deterministic document hygiene, not a subjective content judgement, so there is nothing to withhold behind the paywall. Collapsed by default everywhere so it never outweighs the first real insight. */
export function AtsPanel({ ats, locale }: { ats?: AtsCheckResult; locale: Locale }) {
  const t = copy[locale];
  const [expanded, setExpanded] = useState(false);
  if (!ats) return null;
  const visibleChecks = ats.checks.filter((check): check is typeof check & { status: Exclude<AtsCheckStatus, "not_applicable"> } => check.status !== "not_applicable");
  const previewChecks = [...visibleChecks].sort((a, b) => ATS_STATUS_PRIORITY[a.status] - ATS_STATUS_PRIORITY[b.status]).slice(0, ATS_PREVIEW_SIZE);
  const canToggle = visibleChecks.length > previewChecks.length;
  const checksToShow = expanded ? visibleChecks : previewChecks;
  return <div className="ats-panel">
    <div><b>{t.atsTitle}</b><p>{t.atsCaption}</p></div>
    <div className="ats-score"><strong>{ats.score}<small>/100</small></strong><i><span style={{ width: `${ats.score}%` }}/></i></div>
    {checksToShow.length ? <ul className="ats-findings">{checksToShow.map((check) => {
      const checkCopy = ATS_CHECK_COPY[locale][check.id][check.status];
      return <li key={check.id} className={ATS_STATUS_CLASS[check.status]}><b>{checkCopy.title}</b><span>{checkCopy.caption}</span></li>;
    })}</ul> : null}
    {canToggle ? <button type="button" className="ats-toggle" onClick={() => setExpanded((value) => !value)}>{expanded ? t.atsCollapse : t.atsShowAll}</button> : null}
  </div>;
}
