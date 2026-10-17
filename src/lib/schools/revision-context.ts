import type { CVReport } from "@/lib/ai/schemas/report";
import { normalizeReportRecommendations } from "@/lib/ai/report-recommendations";
import { schoolRevisionQuestions, type SchoolRevisionAnswer, type SchoolRevisionQuestion } from "./revision-questions";

export type SavedSchoolAnswer = {
  version: number; method: string; savedAt: string;
  question: SchoolRevisionQuestion;
  category: string; diagnosticKind: string; anchors: string[];
  answer: SchoolRevisionAnswer;
};

// Ignore generic report language. Remaining terms must also occur in the CV.
const generic = new Set("który która które zosta zostały wykona wyłącznie własn wkład kandy samod osobis opisa opisu opisów zmian zmien proje aplik inter imple zaimp opart danyc pracy dodat obejm funkc techn dział spraw weryf testó potwi infor dopre ustal zakre konkr podst kursa edukac podan widoc dokum przec opini scenar rezul wyniki rezult gotow osoby przed formu".split(" ").map(word => word.slice(0, 5)));
const words = (value: string) => [...new Set((value.toLocaleLowerCase("pl").match(/\p{L}{5,}/gu) || []).map(word => word.slice(0, 5)))];

export function schoolAnswerMethod(report: CVReport, comparisonKey = ""): string {
  return JSON.stringify([comparisonKey, report.locale, report.rubricVersion, report.promptVersion, report.document.targetRole, report.document.targetSeniority, report.document.careerContext || ""]);
}

function topic(report: CVReport, question: SchoolRevisionQuestion) {
  const issue = report.issues.find(item => item.id === question.id)!;
  const sourceWords = new Set(words(Object.values(report.evidenceMap || {}).join(" ")));
  const context = `${issue.title} ${issue.action} ${issue.explanation}`;
  const topicText = issue.diagnosticKind === "missing_verification" && /projek(?:tów|tach|tami|ty)|\bprojects\b/iu.test(context)
    ? `${context} ${report.issues.filter(item => item.category === "ownership").map(item => `${item.action} ${item.explanation}`).join(" ")}`
    : context;
  const anchors = words(topicText).filter(word => sourceWords.has(word) && !generic.has(word));
  return { category: issue.category, diagnosticKind: issue.diagnosticKind || "other", anchors };
}

export function findSchoolAnswer(report: CVReport, question: SchoolRevisionQuestion, version: number, method: string, saved: SavedSchoolAnswer[]): SavedSchoolAnswer | undefined {
  const eligible = saved.filter(item => item.method === method && item.version <= version);
  if (!eligible.length) return;
  const issue = report.issues.find(item => item.id === question.id)!;
  const exact = eligible.find(item => item.version === version && item.question.id === question.id && item.category === issue.category && item.diagnosticKind === (issue.diagnosticKind || "other"));
  if (exact) return exact;
  const current = topic(report, question);
  // Never close an unrelated project's question just because its category matches.
  // Changed wording must retain at least two source-backed topic terms; ambiguous
  // or generic findings stay open for human review.
  if (current.diagnosticKind === "other" || current.anchors.length < 2) return;
  const sameTopicCategory = (category: string) => category === current.category
    || (current.diagnosticKind === "missing_verification" && [category, current.category].every(key => ["impact", "credibility"].includes(key)));
  const candidates = eligible.filter(item => item.version < version && sameTopicCategory(item.category)
    && item.diagnosticKind === current.diagnosticKind && current.anchors.every(anchor => item.anchors.includes(anchor)));
  if (candidates.length) return candidates.length === 1 ? candidates[0] : undefined;
  // A report can merge two previously separate ownership findings. Reuse their
  // answers only if each has distinct source-backed subject terms and together
  // they cover the whole current topic. Mixed answers resolve conservatively to
  // unknown; they never imply that all queried work was performed.
  if (current.category !== "ownership" || !["limited_contribution", "unattributed_contribution"].includes(current.diagnosticKind)) return;
  const parts = eligible.filter(item => item.version < version && item.category === "ownership"
    && ["limited_contribution", "unattributed_contribution"].includes(item.diagnosticKind)
    && current.anchors.filter(anchor => item.anchors.includes(anchor)).length >= 2);
  if (parts.length < 2 || parts.some(item => item.answer.status === "skipped")
    || parts.some((item, index) => parts.some((other, otherIndex) => index !== otherIndex && item.anchors.every(anchor => other.anchors.includes(anchor))))) return;
  const covered = [...new Set(parts.flatMap(item => item.anchors))];
  if (!current.anchors.every(anchor => covered.includes(anchor))) return;
  const sameStatus = parts.every(item => item.answer.status === parts[0].answer.status);
  const combinedText = parts.map(item => item.answer.text).join("\n");
  if (sameStatus && parts[0].answer.status === "confirmed" && combinedText.length > 1500) return;
  return { ...parts[0], question, ...current, version: Math.max(...parts.map(item => item.version)),
    answer: sameStatus ? { status: parts[0].answer.status, text: parts[0].answer.status === "confirmed" ? combinedText : "" } : { status: "unknown", text: "" } };
}

export function saveSchoolAnswers(report: CVReport, version: number, method: string, answers: Record<string, SchoolRevisionAnswer>, previous: SavedSchoolAnswer[]): SavedSchoolAnswer[] {
  const additions = schoolRevisionQuestions(report).filter(q => answers[q.id]).map(question => {
    const answer = answers[question.id];
    if (!Number.isInteger(version) || version < 0 || !["confirmed", "not_done", "unknown", "skipped"].includes(answer.status) || answer.text.length > 1500 || (answer.status === "confirmed" && !answer.text.trim())) throw new Error("Nieprawidłowa odpowiedź.");
    return { version, method, savedAt: new Date().toISOString(), question, ...topic(report, question),
      answer: { status: answer.status, text: answer.status === "confirmed" ? answer.text.trim() : "" } };
  });
  return [...previous.filter(item => !additions.some(next => next.method === item.method && next.version === item.version && next.question.id === item.question.id)), ...additions].slice(-20);
}

export function schoolAnswerNextAction(answer: SchoolRevisionAnswer, diagnosticKind?: string): string {
  if (answer.status === "not_done" && ["missing_verification", "limited_verification"].includes(diagnosticKind || "")) return "Kursant potwierdził, że nie wykonał sprawdzeń. Ta luka pozostaje. Najpierw rzeczywiście sprawdź działanie opisanego projektu i zanotuj konkretne scenariusze, wykryte problemy oraz wynik. Dopiero potem opisz w CV faktycznie wykonane sprawdzenia. Nie dopisuj testów, które się nie odbyły.";
  if (answer.status === "not_done") return "Kursant potwierdził, że nie wykonał tego działania. Ta luka pozostaje. Najpierw wykonaj rzeczywistą pracę związaną z tym zaleceniem i zanotuj przebieg oraz wynik; dopiero wtedy uzupełnij CV. Nie dopisuj niewykonanych działań.";
  if (answer.status === "unknown") return "Kursant nie może potwierdzić tych faktów. Sprawdź dostępne materiały lub repozytorium przed uzupełnieniem CV. Nie zamieniaj niepewności w osiągnięcie.";
  if (answer.status === "confirmed") return "Odpowiedź kursanta została zapisana. Sprawdź, czy potwierdzone fakty zostały poprawnie uwzględnione w tej wersji CV. Sama odpowiedź nie podnosi oceny dokumentu.";
  return "Pytanie zostało pominięte. Luka pozostaje otwarta; możesz wrócić do odpowiedzi później.";
}

/** Changes presentation only. The original report, grades and model input stay intact. */
export function applySchoolAnswerContext(input: CVReport, version: number, method: string, saved: SavedSchoolAnswer[]): CVReport {
  const report = normalizeReportRecommendations(input);
  const resolved = new Map(schoolRevisionQuestions(report).flatMap(q => {
    const item = findSchoolAnswer(report, q, version, method, saved);
    return item && item.answer.status !== "skipped" ? [[q.id, item] as const] : [];
  }));
  const action = (id: string | undefined, original: string) => id && resolved.has(id) ? schoolAnswerNextAction(resolved.get(id)!.answer, resolved.get(id)!.diagnosticKind) : original;
  return { ...report,
    issues: report.issues.map(issue => ({ ...issue, action: action(issue.id, issue.action) })),
    nextSteps: report.nextSteps.map(step => ({ ...step, action: action(step.issueId, step.action) })),
  };
}
