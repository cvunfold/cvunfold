import { createCareerSample } from "./career-samples";
import type { CareerContext } from "./career-context";
import type { CVReport } from "./schemas/report";
import type { AtsCheckResult } from "@/lib/ats-checker/types";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { PROMPT_VERSION } from "./prompts/review-pl-v3";
import type { Locale } from "@/lib/i18n";
import { sampleReportEn } from "./sample-report-en";
import { calculateOverall } from "./validate-report";

const scores: Record<string, number> = { impact: 58, ownership: 68, credibility: 82, architecture: 65, collaboration: 74, clarity: 76 };
const mockAts: AtsCheckResult = {
  score: 88,
  checks: [
    { id: "text_layer", status: "pass" }, { id: "reading_order", status: "pass" }, { id: "sections", status: "pass" },
    { id: "dates_titles", status: "pass" }, { id: "contact_info", status: "pass" }, { id: "layout_columns", status: "pass" },
    { id: "glyph_artifacts", status: "warning" }, { id: "date_format", status: "pass" },
  ],
};

export function createMockReport(targetSeniority: Seniority = "auto", withJob = false, targetRole: TargetRoleId = "frontend_developer", locale: Locale = "pl", careerContext: CareerContext = "standard"): CVReport {
  if (targetSeniority === "first_job") careerContext = "first_job";
  if (targetSeniority === "first_job" || targetSeniority === "junior" || targetSeniority === "mid" || targetSeniority === "lead" || careerContext !== "standard") {
    const id = careerContext !== "standard" && (targetSeniority === "auto" || targetSeniority === "junior") ? careerContext : targetSeniority === "auto" ? "senior" : targetSeniority;
    const report = createCareerSample(id, locale, targetRole);
    report.document.targetSeniority = targetSeniority;
    report.document.careerContext = careerContext;
    if (withJob) report.jobMatch = { score: 71, strongestMatches: [], missingEvidence: [], misplacedEvidence: [], recommendations: [locale === "pl" ? "Porównaj wymagania oferty z udokumentowanym własnym wkładem w projekty." : "Compare the job requirements with your documented personal project contribution."] };
    return report;
  }
  const role = getTargetRoleProfile(targetRole, locale);
  if (locale === "en") {
    const englishReport = structuredClone(sampleReportEn);
    englishReport.document.targetRole = role.label;
    englishReport.document.perceivedRole = role.label;
    englishReport.document.targetSeniority = targetSeniority;
    englishReport.categoryScores = getRubric(targetSeniority, targetRole, locale).map((category) => ({
      ...category,
      score: scores[category.key],
      rationale: `The CV contains a signal relevant to ${role.label}, but it does not always explain its scale or outcome.`,
      evidenceRefs: ["seg_exp_1"],
    }));
    englishReport.summary.overallScore = calculateOverall(englishReport.categoryScores);
    if (withJob) englishReport.jobMatch = {
      score: 71,
      strongestMatches: [role.evaluationFocus[0], role.evaluationFocus[1]],
      missingEvidence: ["The job description names an important responsibility, but the CV does not show a concrete example."],
      misplacedEvidence: ["A relevant signal is hidden in the project description."],
      recommendations: ["Add the required area only if you genuinely have that experience."],
    };
    return englishReport;
  }
  const categoryScores = getRubric(targetSeniority, targetRole, locale).map((category) => ({ ...category, score: scores[category.key], rationale: `CV pokazuje konkretny sygnał istotny dla roli ${role.label}, ale nie zawsze wyjaśnia jego skalę i rezultat.`, evidenceRefs: ["seg_exp_1"] }));
  const report: CVReport = {
    version: "2.1.0", rubricVersion: RUBRIC_VERSION, promptVersion: PROMPT_VERSION, locale,
    evidenceMap: {
      seg_exp_1: "Realizacja funkcji produktowych w React i TypeScript we współpracy z backendem i zespołem produktowym.",
      seg_summary: `Doświadczony ${role.label} ze spójnym profilem technicznym.`,
      seg_project_1: "Zbudowałem dashboard jakości wykrywający regresje przed wydaniem.",
    },
    document: { detectedLanguage: "pl", parseQuality: "good", targetRole: role.label, targetSeniority,
      perceivedRole: role.label, perceivedSeniority: "senior", perceivedSeniorityConfidence: "medium" },
    summary: { overallScore: calculateOverall(categoryScores), oneSentenceVerdict: "Masz mocne doświadczenie, ale dokument nie pokazuje jeszcze jego skali.",
      strongestSignal: `Dokument buduje wiarygodność w obszarze: ${role.evaluationFocus[0]}.`,
      biggestRisk: "Opisujesz przede wszystkim obowiązki, przez co wpływ Twojej pracy pozostaje niewidoczny." },
    recruiterPerspective: {
      profileSummary: `Solidny profil ${role.label}, którego dokument sygnalizuje Seniora, ale nie pokazuje jeszcze pełnej skali wpływu.`,
      seniorityAlignment: targetSeniority === "senior" ? "aligned" : "unclear",
      seniorityAlignmentExplanation: "Techniczna wiarygodność jest czytelna, natomiast ownership i rezultaty są słabiej udowodnione niż zakres wykonywanych zadań.",
      positiveSignals: [
        { title: "Spójny profil specjalistyczny", explanation: `Doświadczenie jest opisane w kontekście istotnym dla roli ${role.label}.`, evidenceRefs: ["seg_exp_1"] },
        { title: "Doświadczenie end-to-end", explanation: "Dokument sygnalizuje udział w pełnym cyklu dostarczania funkcji.", evidenceRefs: ["seg_exp_1"] },
      ],
      reservations: [
        { kind: "evidence", title: "Obowiązki dominują nad rezultatami", explanation: "Opis pracy nie pokazuje, co zmieniło się dzięki działaniom kandydata.", evidenceRefs: ["seg_exp_1"] },
        { kind: "gap", title: "Niejasny zakres decyzji", explanation: "CV nie pokazuje, które decyzje techniczne należały bezpośrednio do kandydata.", evidenceRefs: [] },
      ],
      likelyInterviewQuestions: [
        { question: "Za które decyzje techniczne odpowiadałeś samodzielnie?", whyThisQuestion: "Dokument nie rozdziela ownershipu od realizacji zadań zespołu.", evidenceRefs: [] },
        { question: "Jaki był rezultat najważniejszej dostarczonej funkcji?", whyThisQuestion: "CV opisuje działania, ale nie pokazuje ich wpływu.", evidenceRefs: ["seg_exp_1"] },
      ],
    },
    categoryScores,
    recruiterSimulation: {
      after5Seconds: `Widać doświadczony profil ${role.label} ze spójnym zakresem specjalizacji.`,
      after10Seconds: "Profil wygląda technicznie wiarygodnie, ale trudno szybko ocenić zakres samodzielności.",
      after20Seconds: "Powstaje obraz solidnego specjalisty; brakuje konkretów pokazujących skalę i efekt pracy.",
      simulatedDecision: "maybe", confidence: "medium",
      reasons: ["Technologie są spójne z rolą", "Rezultaty są słabiej widoczne niż zakres obowiązków"],
      whatCouldImproveDecision: ["Dodaj zweryfikowane efekty najważniejszych projektów", "Wyeksponuj decyzje techniczne i ownership"],
    },
    strengths: [
      { id: "s1", title: "Spójny profil specjalistyczny", explanation: `Umiejętności i opis pracy tworzą wiarygodny obraz ${role.label}.`, evidenceRefs: ["seg_exp_1"] },
      { id: "s2", title: "Doświadczenie end-to-end", explanation: "Dokument sygnalizuje udział od implementacji po dostarczenie funkcji.", evidenceRefs: ["seg_exp_1"] },
      { id: "s3", title: "Dobra czytelność", explanation: "Sekcje i chronologia pozwalają szybko znaleźć najważniejsze informacje.", evidenceRefs: ["seg_summary"] },
    ],
    issues: [
      { id: "i1", severity: "critical", category: "impact", title: "Efekty pracy giną pod listą obowiązków",
        explanation: "Najmocniejsze doświadczenie jest opisane jako wykonywane czynności, bez pokazania zmiany, którą wywołały.",
        whyItMatters: "Przy poziomie Senior odbiorca szuka nie tylko technologii, ale też wpływu na produkt, użytkowników lub sposób pracy zespołu.",
        evidenceRefs: ["seg_exp_1"], confidence: "high", action: "Przepisz 2–3 najważniejsze punkty w strukturze działanie → kontekst → zweryfikowany rezultat.",
        suggestion: { type: "question", original: "Realizacja zadań w projekcie.", proposed: null, factualityNote: "Za jaki zweryfikowany zakres odpowiadałeś i jaki był potwierdzony rezultat tej pracy?" } },
      { id: "i2", severity: "important", category: "ownership", title: "Zakres ownershipu jest niejasny",
        explanation: "CV nie pokazuje, gdzie samodzielnie podejmowałeś decyzje, a gdzie realizowałeś ustalony zakres.",
        whyItMatters: "To jeden z głównych sygnałów różnicujących Mid i Senior w odbiorze dokumentu.", evidenceRefs: [], confidence: "medium",
        action: "Dodaj jeden przykład decyzji technicznej wraz z kontekstem i trade-offem.",
        suggestion: { type: "question", original: null, proposed: null, factualityNote: "Czy podejmowałeś decyzje dotyczące architektury, jakości lub sposobu wdrożenia?" } },
      { id: "i3", severity: "minor", category: "clarity", title: "Najmocniejszy projekt jest za nisko",
        explanation: "Najlepszy sygnał techniczny pojawia się dopiero w dalszej części doświadczenia.", whyItMatters: "Pierwszy skan CV może go pominąć.",
        evidenceRefs: ["seg_project_1"], confidence: "high", action: "Przenieś ten punkt wyżej w obrębie stanowiska.",
        suggestion: { type: "expose", original: null, proposed: null, factualityNote: "Zmiana kolejności nie dodaje nowych informacji." } },
    ],
    ats: mockAts,
    jobMatch: null,
    nextSteps: [
      { priority: 1, title: "Pokaż rezultaty", action: "Dodaj zweryfikowany rezultat do dwóch najważniejszych punktów doświadczenia.", expectedImpact: "high" },
      { priority: 2, title: "Wyeksponuj ownership", action: "Nazwij decyzję, za którą odpowiadałeś, oraz jej kontekst.", expectedImpact: "high" },
      { priority: 3, title: "Popraw kolejność", action: "Przenieś najmocniejszy projekt wyżej w sekcji doświadczenia.", expectedImpact: "medium" },
    ],
    limitations: ["Analiza dotyczy wyłącznie treści dokumentu, nie Twoich rzeczywistych kompetencji.", "Symulowana decyzja nie przewiduje wyniku konkretnej rekrutacji."],
  };
  if (withJob) report.jobMatch = { score: 71, strongestMatches: [role.evaluationFocus[0], role.evaluationFocus[1]], missingEvidence: ["Oferta wymienia ważny obszar odpowiedzialności; CV nie pokazuje konkretnego przykładu."], misplacedEvidence: ["Istotny sygnał jest ukryty w opisie projektu."], recommendations: ["Dodaj wymagany obszar wyłącznie, jeśli faktycznie masz w nim doświadczenie."] };
  return report;
}
