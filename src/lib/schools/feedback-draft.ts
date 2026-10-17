import type { AtsCheckId } from "@/lib/ats-checker/types";
import type { CVReport } from "@/lib/ai/schemas/report";

const casualNames: Record<string, string> = {
  jaroslaw: "Jarek", bartosz: "Bartek", franciszek: "Franek", wojciech: "Wojtek",
  jakub: "Kuba", piotr: "Piotrek", tomasz: "Tomek", krzysztof: "Krzysiek",
  grzegorz: "Grzesiek", dariusz: "Darek", przemyslaw: "Przemek", slawomir: "Sławek",
  anna: "Ania", katarzyna: "Kasia", malgorzata: "Gosia", aleksandra: "Ola",
  joanna: "Asia", magdalena: "Magda", agnieszka: "Agnieszka", alicja: "Ala",
};

function feedbackGreeting(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "";
  if (!/^[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*$/u.test(first)) return "Cześć!";
  const key = first.toLocaleLowerCase("pl").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
  if (["kursant", "kursantka", "nieznany", "anonimowy"].includes(key)) return "Cześć!";
  const friendly = casualNames[key] || first.charAt(0).toLocaleUpperCase("pl") + first.slice(1);
  return `Cześć ${friendly}!`;
}

const atsActions: Record<AtsCheckId, string> = {
  text_layer: "wyeksportuj CV jako PDF z zaznaczalnym tekstem, zamiast skanu",
  reading_order: "uporządkuj układ, aby tekst odczytywał się w kolejności od góry do dołu",
  sections: "sprawdź, czy nagłówki sekcji, np. Projekty, Umiejętności i Edukacja, są zapisane zwykłym tekstem i czytelne po eksporcie",
  dates_titles: "zapisz czytelnie daty i nazwy opisanych pozycji w projektach, edukacji lub doświadczeniu",
  contact_info: "sprawdź, czy adres e-mail jest zapisany zwykłym tekstem i daje się odczytać",
  layout_columns: "uprość układ do jednej kolumny, bez tabel rozbijających kolejność tekstu",
  glyph_artifacts: "usuń nietypowe znaki i ikony zastępujące tekst oraz sprawdź tekst po eksporcie",
  date_format: "stosuj jeden format dat w całym CV i unikaj niejednoznacznych dat liczbowych",
};

function atsFeedback(report: CVReport): string | null {
  const ats = report.ats;
  if (!ats) return null;
  const applicable = ats.checks.filter(check => check.status !== "not_applicable");
  if (!applicable.length) return "Checker ATS nie ma dostępnych kontroli dla tego pliku, więc nie podajemy oceny jego czytelności technicznej.";
  const priorities = applicable.filter(check => check.status === "fail" || check.status === "warning")
    .sort((a, b) => Number(b.status === "fail") - Number(a.status === "fail"));
  const result = `Checker ATS ocenił techniczną czytelność pliku na ${ats.score}/100.`;
  return priorities.length
    ? `${result} Proponuję najpierw: ${priorities.slice(0, 3).map(check => atsActions[check.id]).join("; ")}.`
    : `${result} Nie wskazał problemów technicznych wymagających poprawy.`;
}

/** Uses only the current authorized report. No extra AI call or invented candidate facts. */
export function buildFeedbackDraft(name: string, schoolName: string, report: CVReport) {
  const steps = [...report.nextSteps].sort((a, b) => a.priority - b.priority).slice(0, 3);
  const recommendations = steps.length
    ? steps.map((step, i) => `${i + 1}. ${step.title}\n${step.action}`).join("\n\n")
    : report.issues.slice(0, 3).map((issue, i) => `${i + 1}. ${issue.title}\n${issue.action}`).join("\n\n");
  const strength = report.strengths[0];
  const body = [
    feedbackGreeting(name),
    `Przesyłam feedback do Twojego CV przygotowany na podstawie analizy w CVUnfold. ${report.summary.oneSentenceVerdict}`,
    atsFeedback(report),
    strength ? `Co warto zachować:\n${strength.title}\n${strength.explanation}` : null,
    recommendations ? `Proponuję zacząć od tych poprawek:\n\n${recommendations}` : "Przejrzyjmy wspólnie raport, aby ustalić kolejny krok.",
    "Uzupełnij tylko informacje zgodne z Twoim doświadczeniem. Jeśli coś w analizie nie pasuje do Twojego dokumentu, daj znać, omówimy to razem.",
    `Pozdrawiam,\n${schoolName}`,
  ].filter(Boolean).join("\n\n");
  return { subject: `Feedback do CV: ${name}`, body };
}
