import type { Locale } from "@/lib/i18n";
import { getTargetRoleProfile } from "@/lib/roles";
import { getRubric } from "@/lib/rubrics/technical-v1";
import { createCareerSample } from "./career-samples";
import { getReviewPrompt } from "./prompts";
import { calculateOverall } from "./validate-report";
import { AI_ROLE_EXAMPLE_SOURCE } from "./ai-role-example-data";

export const AI_SAMPLE_ROLES = ["ai_llm_engineer", "ai_automation_specialist"] as const;
export type AiSampleRole = typeof AI_SAMPLE_ROLES[number];
export function isAiSampleRole(value: unknown): value is AiSampleRole {
  return AI_SAMPLE_ROLES.some(role => role === value);
}

// Curated synthetic examples, not a claim that a model produced these scores.
export function createAiRoleSample(role: AiSampleRole, locale: Locale) {
  const llm = role === "ai_llm_engineer";
  const source = AI_ROLE_EXAMPLE_SOURCE[role][locale];
  const report = createCareerSample("first_job", locale);
  const profile = getTargetRoleProfile(role, locale);
  const pl = locale === "pl";
  const ref = "seg_ai_example_1";
  const refs = [ref];
  const issue = pl ? "Podsumowanie nie pokazuje konkretnego projektu" : "The summary does not highlight the concrete project";
  const action = pl
    ? "Przenieś opis projektu i własnego wkładu przed listę kursów lub narzędzi, zachowując jego edukacyjny lub własny charakter."
    : "Move the project and personal contribution above the course or tool list, preserving its educational or personal context.";
  const verdict = pl ? "Projekt, własny wkład i sprawdzenia wspierają aplikację do pierwszej pracy." : "The project, personal contribution and checks support a first-job application.";
  const rationales: Record<string, string> = pl ? {
    impact: llm ? "Asystent cytuje źródła i odmawia odpowiedzi, gdy nie ma źródła." : "Workflow zbiera zgłoszenia i pokazuje ich status; efekt nie wymaga wymyślonych oszczędności czasu.",
    ownership: "CV oddziela własną pracę od instrukcji kursu lub pomocy innych osób.",
    credibility: llm ? "Opis wskazuje 20 pytań testowych i poprawę retrievalu po błędnych odpowiedziach. Integracja API nie oznacza treningu modelu." : "Opis wskazuje 12 scenariuszy, walidację i sprawdzenie błędów. Wykonanie w n8n bez kodu jest pełnoprawną praktyką.",
    architecture: llm ? "Cytowanie, odmowa odpowiedzi i izolacja dokumentów opisują decyzje w skali projektu." : "Walidacja, wykrywanie duplikatów, ponowienia i ręczna akceptacja opisują strukturę procesu.",
    collaboration: llm ? "Omówienie błędów z mentorką prowadzi do poprawy filtra użytkownika." : "Uwagi koleżanki prowadzą do poprawy warunku duplikatu.",
    clarity: issue,
  } : {
    impact: llm ? "The assistant cites sources and refuses answers when no source is available." : "The workflow collects submissions and exposes their status; the outcome needs no invented time savings.",
    ownership: "The CV separates personal work from course instructions or help from others.",
    credibility: llm ? "The description identifies 20 test questions and retrieval improvements after incorrect answers. API integration does not mean model training." : "The description identifies 12 scenarios, validation and error checks. No-code n8n implementation is real practice.",
    architecture: llm ? "Citations, refusal and document isolation show decisions at project scale." : "Validation, duplicate detection, retries and manual approval describe process structure.",
    collaboration: llm ? "Discussing errors with a mentor led to correcting the user filter." : "Feedback from a peer led to correcting the duplicate condition.",
    clarity: issue,
  };
  const question = pl
    ? llm ? "Jak dobierałeś pytania testowe i po czym rozpoznawałeś błędną odpowiedź?" : "Jak sprawdziłaś scenariusz ponownego zgłoszenia i błędu API?"
    : llm ? "How did you choose test questions and identify incorrect answers?" : "How did you check duplicate submissions and API errors?";
  report.evidenceMap = { [ref]: source };
  report.document = { ...report.document, targetRole: profile.label, perceivedRole: profile.label };
  report.promptVersion = getReviewPrompt(locale, "first_job", "first_job", role).version;
  report.categoryScores = getRubric("first_job", role, locale).map(category => ({ ...category, score: category.key === "clarity" ? 70 : 74, rationale: rationales[category.key], evidenceRefs: refs }));
  report.summary = { overallScore: calculateOverall(report.categoryScores), oneSentenceVerdict: verdict, strongestSignal: rationales.credibility, biggestRisk: issue };
  report.recruiterPerspective = {
    profileSummary: verdict, seniorityAlignment: "aligned", seniorityAlignmentExplanation: verdict,
    positiveSignals: [{ title: pl ? "Własny wkład i sprawdzenia" : "Personal contribution and checks", explanation: rationales.credibility, evidenceRefs: refs }],
    reservations: [{ kind: "evidence", issueId: "i1", title: issue, explanation: issue, evidenceRefs: refs }],
    likelyInterviewQuestions: [{ question, whyThisQuestion: pl ? "Doprecyzowanie opisanego sprawdzenia." : "Clarifying the documented check.", evidenceRefs: refs }],
  };
  report.recruiterSimulation = { after5Seconds: profile.label, after10Seconds: verdict, after20Seconds: rationales.credibility, simulatedDecision: "interview", confidence: "medium", reasons: [verdict], whatCouldImproveDecision: [action] };
  report.strengths = [{ id: "s1", title: pl ? "Praktyka poparta projektem" : "Project-backed practice", explanation: rationales.credibility, evidenceRefs: refs }];
  report.issues = [{ id: "i1", severity: "minor", category: "clarity", title: issue, explanation: issue, whyItMatters: pl ? "Konkretny projekt ułatwia rozpoznanie profilu." : "A concrete project makes the profile easier to recognise.", evidenceRefs: refs, confidence: "high", action, suggestion: { type: "expose", original: source, proposed: null, factualityNote: pl ? "Zachowaj fakty i przypisanie wkładu." : "Preserve facts and contribution attribution." } }];
  report.nextSteps = [{ priority: 1, issueId: "i1", title: issue, action, expectedImpact: "high" }];
  report.limitations.push(pl ? "Przykład przygotowany redakcyjnie; punktacja ilustracyjna, nie wynik rzeczywistego wywołania modelu." : "Curated example; illustrative scoring, not the output of a live model call.");
  return report;
}
