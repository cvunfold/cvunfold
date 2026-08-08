import type { CVReport } from "./schemas/report";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/frontend-v1";

const scores: Record<string, number> = { impact: 58, ownership: 68, credibility: 82, architecture: 65, collaboration: 74, clarity: 76, ats: 78 };

export function createMockReport(targetSeniority: Seniority = "auto", withJob = false): CVReport {
  const categoryScores = getRubric(targetSeniority).map((category) => ({ ...category, score: scores[category.key], rationale: "CV pokazuje konkretny sygnał, ale nie zawsze wyjaśnia jego skalę i rezultat.", evidenceRefs: ["seg_exp_1"] }));
  const report: CVReport = {
    version: "1.0.0", rubricVersion: RUBRIC_VERSION, promptVersion: "review-pl-v1.0.0", locale: "pl",
    document: { detectedLanguage: "pl", parseQuality: "good", targetRole: "Frontend Developer", targetSeniority,
      perceivedRole: "Frontend Developer", perceivedSeniority: "senior", perceivedSeniorityConfidence: "medium" },
    summary: { overallScore: 70, oneSentenceVerdict: "Masz mocne doświadczenie, ale dokument nie pokazuje jeszcze jego skali.",
      strongestSignal: "Wiarygodne doświadczenie w budowie funkcji end-to-end i pracy z nowoczesnym frontendem.",
      biggestRisk: "Opisujesz przede wszystkim obowiązki, przez co wpływ Twojej pracy pozostaje niewidoczny." },
    categoryScores,
    recruiterSimulation: {
      after5Seconds: "Widać doświadczonego Frontend Developera ze znajomością Reacta i TypeScriptu.",
      after10Seconds: "Profil wygląda technicznie wiarygodnie, ale trudno szybko ocenić zakres samodzielności.",
      after20Seconds: "Powstaje obraz solidnego specjalisty; brakuje konkretów pokazujących skalę i efekt pracy.",
      simulatedDecision: "maybe", confidence: "medium",
      reasons: ["Technologie są spójne z rolą", "Rezultaty są słabiej widoczne niż zakres obowiązków"],
      whatCouldImproveDecision: ["Dodaj zweryfikowane efekty najważniejszych projektów", "Wyeksponuj decyzje techniczne i ownership"],
    },
    strengths: [
      { id: "s1", title: "Spójny profil techniczny", explanation: "Technologie i opis pracy tworzą wiarygodny obraz Frontend Developera.", evidenceRefs: ["seg_exp_1"] },
      { id: "s2", title: "Doświadczenie end-to-end", explanation: "Dokument sygnalizuje udział od implementacji po dostarczenie funkcji.", evidenceRefs: ["seg_exp_1"] },
      { id: "s3", title: "Dobra czytelność", explanation: "Sekcje i chronologia pozwalają szybko znaleźć najważniejsze informacje.", evidenceRefs: ["seg_summary"] },
    ],
    issues: [
      { id: "i1", severity: "critical", category: "impact", title: "Efekty pracy giną pod listą obowiązków",
        explanation: "Najmocniejsze doświadczenie jest opisane jako wykonywane czynności, bez pokazania zmiany, którą wywołały.",
        whyItMatters: "Przy poziomie Senior odbiorca szuka nie tylko technologii, ale też wpływu na produkt, użytkowników lub sposób pracy zespołu.",
        evidenceRefs: ["seg_exp_1"], confidence: "high", action: "Przepisz 2–3 najważniejsze punkty w strukturze działanie → kontekst → zweryfikowany rezultat.",
        suggestion: { type: "rewrite", original: "Rozwój aplikacji w React i TypeScript.", proposed: "Rozwijałem kluczowe ścieżki aplikacji w React i TypeScript, odpowiadając za [zakres]; efekt: [wstaw zweryfikowany rezultat].", factualityNote: "Uzupełnij wyłącznie faktami, które możesz potwierdzić." } },
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
  if (withJob) report.jobMatch = { score: 71, strongestMatches: ["React", "TypeScript"], missingEvidence: ["Oferta wymienia testy E2E; CV nie pokazuje konkretnego przykładu."], misplacedEvidence: ["Wzmianka o wydajności jest ukryta w opisie projektu."], recommendations: ["Dodaj testy E2E wyłącznie, jeśli faktycznie z nimi pracowałeś."] };
  return report;
}
