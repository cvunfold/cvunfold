import type { CVReport } from "./schemas/report";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import { PROMPT_VERSION } from "./prompts/review-pl-v3";

const scores: Record<string, number> = { impact: 58, ownership: 68, credibility: 82, architecture: 65, collaboration: 74, clarity: 76, ats: 78 };

export function createMockReport(targetSeniority: Seniority = "auto", withJob = false, targetRole: TargetRoleId = "frontend_developer"): CVReport {
  const role = getTargetRoleProfile(targetRole);
  const categoryScores = getRubric(targetSeniority, targetRole).map((category) => ({ ...category, score: scores[category.key], rationale: `CV pokazuje konkretny sygnał istotny dla roli ${role.label}, ale nie zawsze wyjaśnia jego skalę i rezultat.`, evidenceRefs: ["seg_exp_1"] }));
  const report: CVReport = {
    version: "2.0.0", rubricVersion: RUBRIC_VERSION, promptVersion: PROMPT_VERSION, locale: "pl",
    document: { detectedLanguage: "pl", parseQuality: "good", targetRole: role.label, targetSeniority,
      perceivedRole: role.label, perceivedSeniority: "senior", perceivedSeniorityConfidence: "medium" },
    summary: { overallScore: 70, oneSentenceVerdict: "Masz mocne doświadczenie, ale dokument nie pokazuje jeszcze jego skali.",
      strongestSignal: `Dokument buduje wiarygodność w obszarze: ${role.evaluationFocus[0]}.`,
      biggestRisk: "Opisujesz przede wszystkim obowiązki, przez co wpływ Twojej pracy pozostaje niewidoczny." },
    recruiterPerspective: {
      profileSummary: `Solidny profil ${role.label}, którego dokument sygnalizuje Seniora, ale nie pokazuje jeszcze pełnej skali wpływu.`,
      seniorityAlignment: targetSeniority === "senior" ? "aligned" : targetSeniority === "lead" ? "undersold" : "unclear",
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
        suggestion: { type: "rewrite", original: "Realizacja zadań w projekcie.", proposed: "Odpowiadałem za [zweryfikowany zakres] w obszarze projektu; efekt: [wstaw zweryfikowany rezultat].", factualityNote: "Uzupełnij wyłącznie faktami, które możesz potwierdzić." } },
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
    ats: { score: 78, findings: [
      { type: "positive", title: "Czytelne nagłówki", explanation: "Sekcje mają standardowe, rozpoznawalne nazwy." },
      { type: "warning", title: "Technologie bez kontekstu", explanation: "Część słów kluczowych nie jest powiązana z doświadczeniem." },
    ] },
    jobMatch: null,
    nextSteps: [
      { priority: 1, title: "Pokaż rezultaty", action: "Dodaj zweryfikowany rezultat do dwóch najważniejszych punktów doświadczenia.", expectedImpact: "high" },
      { priority: 2, title: "Wyeksponuj ownership", action: "Nazwij decyzję, za którą odpowiadałeś, oraz jej kontekst.", expectedImpact: "high" },
      { priority: 3, title: "Popraw kolejność", action: "Przenieś najmocniejszy projekt wyżej.", expectedImpact: "medium" },
    ],
    limitations: ["Analiza dotyczy wyłącznie treści dokumentu, nie Twoich rzeczywistych kompetencji.", "Symulowana decyzja nie przewiduje wyniku konkretnej rekrutacji."],
  };
  if (withJob) report.jobMatch = { score: 71, strongestMatches: [role.evaluationFocus[0], role.evaluationFocus[1]], missingEvidence: ["Oferta wymienia ważny obszar odpowiedzialności; CV nie pokazuje konkretnego przykładu."], misplacedEvidence: ["Istotny sygnał jest ukryty w opisie projektu."], recommendations: ["Dodaj wymagany obszar wyłącznie, jeśli faktycznie masz w nim doświadczenie."] };
  return report;
}
