import type { CVReport } from "./schemas/report";
import { calculateOverall } from "./validate-report";
import { getRubric, RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { PROMPT_VERSION } from "./prompts/review-pl-v3";

const evidence = {
  seg_summary: "Senior Frontend Developer z 7-letnim doświadczeniem w React, TypeScript i Next.js. Specjalizuję się w wydajności aplikacji oraz budowie design systemów.",
  seg_exp_1: "Przeprowadziłam migrację trzech kluczowych ścieżek checkoutu do Next.js. Po wdrożeniu p75 LCP spadło z 3,1 s do 2,2 s, a współczynnik porzuceń na urządzeniach mobilnych zmniejszył się o 8%.",
  seg_exp_2: "Zaprojektowałam i wdrożyłam design system obejmujący 32 komponenty, używany przez cztery zespoły produktowe.",
  seg_exp_3: "Rozwój nowych funkcjonalności w React i TypeScript. Code review. Współpraca z UX i backendem.",
  seg_exp_4: "Przygotowałam RFC dla podziału monolitu frontendowego na moduły domenowe i prowadziłam uzgodnienia z zespołami Checkout, Account oraz Platform.",
  seg_project_1: "Stworzyłam budżety wydajnościowe w CI i dashboard Web Vitals, który wykrywa regresje przed wdrożeniem produkcyjnym.",
} as const;

const scores: Record<string, number> = {
  impact: 82,
  ownership: 72,
  credibility: 90,
  architecture: 80,
  collaboration: 84,
  clarity: 74,
  ats: 86,
};

const rationales: Record<string, string> = {
  impact: "CV zawiera mierzalne rezultaty dotyczące wydajności i konwersji, ale nie przy każdym ważnym projekcie.",
  ownership: "Widać inicjowanie migracji i RFC; część punktów nadal nie rozdziela wkładu kandydatki od pracy całego zespołu.",
  credibility: "Technologie występują w konkretnym kontekście: migracja, pomiar Web Vitals, CI i design system.",
  architecture: "Dokument pokazuje decyzje dotyczące modularizacji i standardów współdzielonych przez kilka zespołów.",
  collaboration: "Widoczna jest współpraca z produktem, UX, backendem oraz facylitowanie uzgodnień między zespołami.",
  clarity: "Najmocniejsze dowody są konkretne, ale mieszają się z ogólnymi punktami o obowiązkach.",
  ats: "Standardowe nagłówki, czytelna chronologia i słowa kluczowe osadzone w doświadczeniu sprzyjają parsowaniu.",
};

const categoryScores = getRubric("senior", "frontend_developer").map((category) => ({
  ...category,
  score: scores[category.key],
  rationale: rationales[category.key],
  evidenceRefs: category.key === "ats" ? ["seg_summary"] : ["seg_exp_1", "seg_exp_4"],
}));

export const sampleProfile = {
  name: "Marta Nowak",
  location: "Warszawa · praca hybrydowa",
  experience: "7 lat doświadczenia",
  target: "Senior Frontend Developer",
  note: "Marta Nowak, firmy i wszystkie wyniki biznesowe są fikcyjne. Przykład pokazuje format oraz poziom szczegółowości raportu CVUnfold.",
  skills: ["React", "TypeScript", "Next.js", "Design Systems", "Web Performance", "Playwright"],
  positions: [
    {
      company: "Lumina Commerce",
      role: "Senior Frontend Developer",
      period: "2022–obecnie",
      bullets: [evidence.seg_exp_1, evidence.seg_exp_2, evidence.seg_exp_3, evidence.seg_exp_4],
    },
    {
      company: "Fieldnote Systems",
      role: "Frontend Developer",
      period: "2019–2022",
      bullets: [
        "Rozwijałam aplikację B2B w React i TypeScript, odpowiadając za moduł raportowania używany przez zespoły operacyjne.",
        evidence.seg_project_1,
      ],
    },
  ],
  evidence,
} as const;

export const sampleReport: CVReport = {
  version: "2.0.0",
  rubricVersion: RUBRIC_VERSION,
  promptVersion: PROMPT_VERSION,
  locale: "pl",
  document: {
    detectedLanguage: "pl",
    parseQuality: "good",
    targetRole: "Frontend Developer",
    targetSeniority: "senior",
    perceivedRole: "Frontend Developer",
    perceivedSeniority: "senior",
    perceivedSeniorityConfidence: "high",
  },
  summary: {
    overallScore: calculateOverall(categoryScores),
    oneSentenceVerdict: "Dokument wiarygodnie komunikuje poziom Senior, ale traci część siły przez niejasny indywidualny wkład.",
    strongestSignal: "Mierzalny wpływ na wydajność checkoutu połączony z inicjowaniem zmian architektonicznych.",
    biggestRisk: "Najbardziej wartościowe dowody sąsiadują z ogólnymi obowiązkami, przez co ownership nie zawsze jest jednoznaczny.",
  },
  recruiterPerspective: {
    profileSummary: "Senior Frontend Developerka o mocnej specjalizacji w web performance, z widocznym wpływem architektonicznym i międzyzespołowym.",
    seniorityAlignment: "aligned",
    seniorityAlignmentExplanation: "Dokument komunikuje poziom Senior: pokazuje mierzalne rezultaty, inicjowanie zmian i pracę wykraczającą poza własny backlog. Największą niewiadomą pozostaje dokładny zakres osobistych decyzji przy design systemie.",
    positiveSignals: [
      {
        title: "Wpływ połączony z wynikiem produktu",
        explanation: "Poprawa LCP została powiązana ze spadkiem porzuceń mobilnego checkoutu, więc odbiorca widzi nie tylko optymalizację techniczną, ale też jej znaczenie.",
        evidenceRefs: ["seg_exp_1"],
      },
      {
        title: "Inicjatywa architektoniczna",
        explanation: "RFC i prowadzenie uzgodnień z trzema zespołami sugerują samodzielność oraz wpływ na kierunek rozwiązania.",
        evidenceRefs: ["seg_exp_4"],
      },
      {
        title: "Specjalizacja poparta praktyką",
        explanation: "Budżety wydajnościowe w CI i dashboard Web Vitals budują wiarygodny, rozpoznawalny profil performance.",
        evidenceRefs: ["seg_project_1"],
      },
    ],
    reservations: [
      {
        kind: "evidence",
        title: "Niejasny zakres ownershipu design systemu",
        explanation: "Sformułowanie „zaprojektowałam i wdrożyłam” nie pokazuje, które decyzje należały do kandydatki, a które do czterech zespołów korzystających z rozwiązania.",
        evidenceRefs: ["seg_exp_2"],
      },
      {
        kind: "evidence",
        title: "Mocne dowody mieszają się z obowiązkami",
        explanation: "Ogólny punkt o rozwoju funkcji, code review i współpracy osłabia precyzyjny obraz widoczny w pozostałych osiągnięciach.",
        evidenceRefs: ["seg_exp_3"],
      },
    ],
    likelyInterviewQuestions: [
      {
        question: "Które decyzje dotyczące design systemu należały bezpośrednio do Ciebie?",
        whyThisQuestion: "Rekruter będzie chciał oddzielić osobisty ownership od pracy wykonanej wspólnie przez kilka zespołów.",
        evidenceRefs: ["seg_exp_2"],
      },
      {
        question: "Jak wyglądał trade-off przy podziale monolitu na moduły domenowe?",
        whyThisQuestion: "RFC jest mocnym sygnałem seniority, ale CV nie pokazuje rozważanych alternatyw ani kryteriów decyzji.",
        evidenceRefs: ["seg_exp_4"],
      },
      {
        question: "Co zmieniła adopcja design systemu poza liczbą komponentów?",
        whyThisQuestion: "Skala wdrożenia jest widoczna, lecz rezultat organizacyjny lub produktowy pozostaje niewiadomy.",
        evidenceRefs: ["seg_exp_2"],
      },
    ],
  },
  categoryScores,
  recruiterSimulation: {
    after5Seconds: "Doświadczona Frontend Developerka z aktualnym stackiem i czytelną ścieżką rozwoju.",
    after10Seconds: "Wyróżniają się konkretne wyniki: poprawa LCP, spadek porzuceń i design system używany przez cztery zespoły.",
    after20Seconds: "Profil spełnia oczekiwania wobec Seniora; do rozmowy pozostaje ustalenie osobistego wkładu w inicjatywy zespołowe.",
    simulatedDecision: "interview",
    confidence: "high",
    reasons: [
      "Rezultaty są mierzalne i osadzone w kontekście produktu.",
      "CV pokazuje inicjowanie zmian, a nie wyłącznie realizację zadań.",
      "Technologie są poparte konkretnymi zastosowaniami.",
    ],
    whatCouldImproveDecision: [
      "Doprecyzować osobistą odpowiedzialność za design system.",
      "Zastąpić ogólny punkt o rozwoju funkcji przykładem decyzji lub rezultatu.",
    ],
  },
  strengths: [
    {
      id: "s1",
      title: "Rezultaty połączone z produktem",
      explanation: "Poprawa LCP nie jest przedstawiona w próżni — dokument łączy ją również ze spadkiem porzuceń mobilnego checkoutu.",
      evidenceRefs: ["seg_exp_1"],
    },
    {
      id: "s2",
      title: "Widoczna inicjatywa architektoniczna",
      explanation: "Przygotowanie RFC i prowadzenie uzgodnień sygnalizują wpływ wykraczający poza własny backlog.",
      evidenceRefs: ["seg_exp_4"],
    },
    {
      id: "s3",
      title: "Techniczna wiarygodność",
      explanation: "Web Vitals, budżety wydajnościowe i CI tworzą spójny, konkretny obraz specjalizacji w performance.",
      evidenceRefs: ["seg_project_1"],
    },
    {
      id: "s4",
      title: "Wpływ międzyzespołowy",
      explanation: "Design system używany przez cztery zespoły pokazuje skalę organizacyjną rozwiązania.",
      evidenceRefs: ["seg_exp_2"],
    },
  ],
  issues: [
    {
      id: "i1",
      severity: "critical",
      category: "ownership",
      title: "Nie wiadomo, co dokładnie oznacza „zaprojektowałam i wdrożyłam”",
      explanation: "Design system brzmi jak duża inicjatywa, ale punkt nie rozdziela decyzji kandydatki, pracy wykonawczej i udziału pozostałych zespołów.",
      whyItMatters: "Przy roli Senior odbiorca chce zrozumieć zakres decyzji: standardy API, governance, adopcję, migrację czy samą implementację komponentów.",
      evidenceRefs: ["seg_exp_2"],
      confidence: "high",
      action: "Dodać zakres odpowiedzialności oraz sposób doprowadzenia do adopcji przez cztery zespoły.",
      suggestion: {
        type: "rewrite",
        original: evidence.seg_exp_2,
        proposed: "Zaprojektowałam kontrakty API i model wersjonowania design systemu (32 komponenty), a następnie poprowadziłam migrację i adopcję w czterech zespołach produktowych.",
        factualityNote: "Użyj tej wersji wyłącznie, jeśli zakres API, wersjonowanie i prowadzenie migracji są zgodne z faktami.",
      },
    },
    {
      id: "i2",
      severity: "important",
      category: "clarity",
      title: "Ogólny punkt osłabia bardzo mocną sekcję",
      explanation: "Po dwóch konkretnych osiągnięciach pojawia się lista standardowych obowiązków, która nie wnosi nowej informacji.",
      whyItMatters: "Rekruter może potraktować cały opis stanowiska jako mieszankę odpowiedzialności zespołu, zamiast zauważyć indywidualny wpływ.",
      evidenceRefs: ["seg_exp_3"],
      confidence: "high",
      action: "Usunąć punkt albo zastąpić go jednym przykładem funkcji, decyzji lub problemu rozwiązanym we współpracy z UX i backendem.",
      suggestion: {
        type: "question",
        original: evidence.seg_exp_3,
        proposed: null,
        factualityNote: "Jaki był najtrudniejszy problem produktowy rozwiązany wspólnie z UX i backendem?",
      },
    },
    {
      id: "i3",
      severity: "important",
      category: "impact",
      title: "Design system nie ma opisanego rezultatu",
      explanation: "Liczba komponentów i zespołów pokazuje skalę, lecz nie mówi, co zmieniło się po wdrożeniu.",
      whyItMatters: "Skala rozwiązania nie jest tym samym co wpływ. Efektem mogła być szybsza realizacja, mniej regresji albo większa spójność — dokument tego nie rozstrzyga.",
      evidenceRefs: ["seg_exp_2"],
      confidence: "medium",
      action: "Dodać wyłącznie zweryfikowany rezultat adopcji albo jawnie pozostawić punkt bez liczby.",
      suggestion: {
        type: "gap",
        original: null,
        proposed: null,
        factualityNote: "Nie dopisuj procentów ani oszczędności czasu bez danych. Sprawdź PR-y, release notes lub metryki adopcji.",
      },
    },
    {
      id: "i4",
      severity: "minor",
      category: "clarity",
      title: "Specjalizacja w performance pojawia się zbyt późno",
      explanation: "Budżety wydajnościowe i automatyczne wykrywanie regresji są silnym wyróżnikiem, ale znajdują się dopiero przy wcześniejszym stanowisku.",
      whyItMatters: "Ten dowód wzmacnia aktualną narrację o specjalizacji i powinien być widoczny już w podsumowaniu lub najnowszym doświadczeniu.",
      evidenceRefs: ["seg_project_1"],
      confidence: "high",
      action: "Dodać krótką wzmiankę o performance governance w podsumowaniu, bez duplikowania całego punktu.",
      suggestion: {
        type: "expose",
        original: null,
        proposed: null,
        factualityNote: "Zmiana ekspozycji korzysta wyłącznie z informacji już obecnych w CV.",
      },
    },
  ],
  ats: {
    score: 86,
    findings: [
      { type: "positive", title: "Standardowa struktura", explanation: "Nazwy sekcji, stanowiska i daty są łatwe do zidentyfikowania przez parser." },
      { type: "positive", title: "Słowa kluczowe mają kontekst", explanation: "React, Next.js, CI i Web Vitals pojawiają się przy konkretnych działaniach." },
      { type: "warning", title: "Częściowe dublowanie stacku", explanation: "Lista umiejętności powtarza technologie widoczne już w doświadczeniu i może zostać skrócona." },
    ],
  },
  jobMatch: null,
  nextSteps: [
    { priority: 1, title: "Doprecyzuj ownership design systemu", action: "Nazwij własne decyzje, sposób współpracy i zakres odpowiedzialności za adopcję.", expectedImpact: "high" },
    { priority: 2, title: "Usuń ogólny punkt o obowiązkach", action: "Zastąp go jednym konkretnym przykładem rozwiązania problemu produktowego.", expectedImpact: "high" },
    { priority: 3, title: "Dodaj rezultat design systemu", action: "Sprawdź dostępne dane i opisz efekt bez estymowania nieznanych liczb.", expectedImpact: "medium" },
    { priority: 4, title: "Wyeksponuj specjalizację", action: "Przenieś sygnał o automatycznym pilnowaniu wydajności do podsumowania profilu.", expectedImpact: "medium" },
  ],
  limitations: [
    "Analiza dotyczy wyłącznie informacji widocznych w przykładowym dokumencie.",
    "Symulacja pierwszego wrażenia nie przewiduje wyniku konkretnej rekrutacji.",
    "Wszystkie dane osoby, firm i rezultatów w tym przykładzie są fikcyjne.",
  ],
};
