import type { CVReport } from "./schemas/report";
import { calculateOverall } from "./validate-report";
import { getRubric, RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
import { PROMPT_VERSION } from "./prompts/review-pl-v3";
import { brand } from "@/lib/brand";

// VertexPay = current role, Railbird Mobility = previous role. Deliberately
// kept in evidence quotes matching the current role's more general bullets
// against the previous role's stronger, measurable ones — the report's own
// central finding.
const evidence = {
  seg_summary: "Senior Frontend Engineer z około ośmioletnim doświadczeniem w React i TypeScript, specjalizujący się w wydajności, dostępności i architekturze UI.",
  seg_4: "Koordynowała dostarczenie frontendowej części redesignu procesu onboardingu klientów używanego przez trzy zespoły produktowe, współpracując z product, design i backendem.",
  seg_5: "Pomagała stworzyć współdzieloną bibliotekę 28 komponentów, używaną obecnie w kilku obszarach produktu.",
  seg_6: "Zaplanowała i dostarczyła migrację ekranów onboardingu ze starszych wzorców Redux do hooks, React Query i bardziej modularnej struktury frontendu.",
  seg_7: "Poprawiła Core Web Vitals i wydajność ładowania w procesach onboardingu oraz zarządzania kontem.",
  seg_8: "Tworzyła funkcje dla użytkowników, wykonywała code review i wspierała mniej doświadczonych frontend developerów w codziennych pytaniach technicznych.",
  seg_9: "Koordynowała implementację frontendu w kilku strumieniach prac onboardingowych i uczestniczyła w dyskusjach architektonicznych z backend engineerami.",
  seg_patterns: "Ustanowiła powtarzalne wzorce dla formularzy, nawigacji, walidacji i stanów informacji zwrotnej, współpracując z designerami i inżynierami z innych zespołów w miarę rozszerzania adopcji.",
  seg_rollout: "Ustaliła etapy rolloutu i kontrole wydania, dzięki czemu redesign onboardingu wdrożono bez zakłócenia aktywnego pozyskiwania klientów.",
  seg_a11y: "Wprowadziła testy Playwright do procesu wydań oraz poprawiła nawigację klawiaturą i obsługę błędów formularzy po przeglądzie dostępności.",
  seg_b: "Zmniejszyła p75 LCP w mobilnym procesie rezerwacji z 4,4 s do 2,5 s oraz ograniczyła porzucanie rezerwacji mobilnych o 10% dzięki route-level code splitting, optymalizacji obrazów i performance budgets w CI.",
  seg_c: "Napisała RFC dotyczące podziału dużej aplikacji frontendowej na moduły domenowe i doprowadziła do uzgodnienia rozwiązania z zespołami backendowymi i platformowymi przed wdrożeniem.",
} as const;

// Weighted to round to 79, not a rounder number — an important issue touches
// impact, ownership and clarity, so each stays within the rc4 calibration
// procedure's default cap of 79 for a category a material issue concerns.
const scores: Record<string, number> = {
  impact: 74,
  ownership: 76,
  credibility: 86,
  architecture: 82,
  collaboration: 82,
  clarity: 72,
};

const rationales: Record<string, string> = {
  impact: "Kategoria ma bardzo mocny dowód w Railbird Mobility: konkretne wyniki LCP i porzuceń rezerwacji. W VertexPay wpływ jest deklarowany, ale bez porównania przed i po lub obserwowalnej konsekwencji, dlatego powtarzalność dowodu w najnowszej roli jest ograniczona.",
  ownership: "CV pokazuje zaplanowanie migracji, napisanie RFC i doprowadzenie do uzgodnienia rozwiązania. W najnowszej roli część opisów używa jednak czasowników „Koordynowała” i „Pomagała”, przez co granice osobistej odpowiedzialności są mniej jednoznaczne.",
  credibility: "Dokument zawiera konkretne frontendowe mechanizmy i rezultaty: route-level code splitting, optymalizację obrazów, performance budgets, Playwright, poprawę dostępności oraz migrację architektury. Są to dowody praktyki, a nie tylko lista technologii.",
  architecture: "RFC o modułach domenowych, migracja do bardziej modularnej struktury oraz współdzielona biblioteka komponentów pokazują myślenie systemowe. W VertexPay brakuje jednak szczegółów dotyczących granic komponentów, API biblioteki lub uzasadnienia kluczowych trade-offów.",
  collaboration: "CV pokazuje współpracę z product, design, backendem, QA oraz zespołami platformowymi, a także pracę przy rozwiązaniu używanym przez trzy zespoły produktowe. Część opisów nie precyzuje jednak, jaki wpływ osoba aplikująca miała na uzgodnienia i decyzje.",
  clarity: "CV ma czytelne sekcje, chronologię i wyraźne specjalizacje, ale najlepsze dowody — konkretne rezultaty wydajnościowe i RFC — znajdują się przy wcześniejszej roli. Najnowsza rola oraz inicjatywy są bardziej ogólne, więc hierarchia sygnałów nie maksymalizuje odbioru seniority.",
};

const categoryEvidenceRefs: Record<string, string[]> = {
  impact: ["seg_b", "seg_7"],
  ownership: ["seg_c", "seg_4", "seg_5"],
  credibility: ["seg_b", "seg_a11y", "seg_6"],
  architecture: ["seg_c", "seg_6", "seg_5"],
  collaboration: ["seg_4", "seg_9"],
  clarity: ["seg_b", "seg_c", "seg_8"],
};

const categoryScores = getRubric("senior", "frontend_developer").map((category) => ({
  ...category,
  score: scores[category.key],
  rationale: rationales[category.key],
  evidenceRefs: categoryEvidenceRefs[category.key],
}));

export const sampleProfile = {
  name: "Julia Zawadzka",
  location: "Warszawa · praca hybrydowa",
  experience: "~8 lat doświadczenia",
  target: "Senior Frontend Engineer",
  note: `Julia Zawadzka, firmy i wszystkie wyniki biznesowe są fikcyjne. Przykład pokazuje format oraz poziom szczegółowości raportu ${brand.name}.`,
  skills: ["React", "TypeScript", "React Query", "Web Performance", "Accessibility", "Playwright"],
  positions: [
    {
      company: "VertexPay",
      role: "Senior Frontend Engineer",
      period: "2023–obecnie",
      bullets: [evidence.seg_4, evidence.seg_5, evidence.seg_6, evidence.seg_7, evidence.seg_8],
    },
    {
      company: "Railbird Mobility",
      role: "Senior Frontend Engineer",
      period: "2020–2023",
      bullets: [evidence.seg_b, evidence.seg_c, evidence.seg_a11y],
    },
  ],
  evidence,
} as const;

export const sampleReport: CVReport = {
  version: "2.1.0",
  rubricVersion: RUBRIC_VERSION,
  promptVersion: PROMPT_VERSION,
  locale: "pl",
  evidenceMap: evidence,
  document: {
    detectedLanguage: "pl",
    parseQuality: "good",
    targetRole: "Frontend Developer",
    targetSeniority: "senior",
    perceivedRole: "Senior Frontend Engineer specjalizujący się w React, TypeScript, wydajności, dostępności i architekturze UI",
    perceivedSeniority: "senior",
    perceivedSeniorityConfidence: "high",
  },
  summary: {
    overallScore: calculateOverall(categoryScores),
    oneSentenceVerdict: "CV wiarygodnie komunikuje poziom Senior Frontend, głównie dzięki mocnym dowodom wydajności, architektury i jakości z wcześniejszej roli, ale najnowsze doświadczenie jest opisane bardziej ogólnie i słabiej pokazuje rezultat oraz granice indywidualnego ownershipu.",
    strongestSignal: "Mierzalny wpływ na wydajność połączony z decyzją architektoniczną w roli Senior Frontend Engineer w Railbird Mobility.",
    biggestRisk: "Najnowsza rola opisuje szeroki zakres inicjatyw, ale bez rezultatów i jasnych granic ownershipu, przez co jej wkład w seniority jest trudniejszy do potwierdzenia.",
  },
  recruiterPerspective: {
    profileSummary: "Dokument pokazuje doświadczony profil frontendowy z około ośmioma latami pracy w React i TypeScript. Najmocniejsze dowody dotyczą wydajności, architektury modułowej, testów end-to-end i dostępności. Najnowsza rola sugeruje szerszy zakres odpowiedzialności, ale jej opis jest mniej konkretny niż opis roli w Railbird Mobility.",
    seniorityAlignment: "aligned",
    seniorityAlignmentExplanation: "Target Senior jest wsparty przez konkretne decyzje techniczne, rezultaty, skalę użytkowania, pracę międzyzespołową oraz wpływ na proces delivery. Odczyt seniority opiera się przede wszystkim na Railbird Mobility, natomiast VertexPay wzmacnia obraz zakresu, lecz słabiej dokumentuje wpływ i indywidualny wkład.",
    positiveSignals: [
      {
        title: "Mierzalny wpływ na wydajność i produkt",
        explanation: "CV pokazuje zarówno mechanizm techniczny, jak i rezultat biznesowo-użytkowy: optymalizacje doprowadziły do redukcji p75 LCP z 4,4 s do 2,5 s oraz ograniczenia porzuceń rezerwacji mobilnych o 10%.",
        evidenceRefs: ["seg_b"],
      },
      {
        title: "Wiarygodne myślenie architektoniczne",
        explanation: "RFC dotyczące podziału aplikacji na moduły domenowe oraz uzgodnienie rozwiązania z zespołami backendowymi i platformowymi to konkretny dowód decyzji systemowej wykraczającej poza pojedynczą funkcję.",
        evidenceRefs: ["seg_c"],
      },
      {
        title: "Praktyczne podejście do jakości i dostępności",
        explanation: "Wdrożenie testów Playwright do procesu wydań oraz poprawa nawigacji klawiaturą i obsługi błędów formularzy po przeglądzie dostępności pokazują zastosowanie praktyk jakościowych w produkcie.",
        evidenceRefs: ["seg_a11y"],
      },
      {
        title: "Zakres współpracy i wpływu frontendowego",
        explanation: "Opis VertexPay wskazuje na pracę przy procesie używanym przez trzy zespoły produktowe, współdzieloną bibliotekę 28 komponentów oraz współpracę z product, design i backendem.",
        evidenceRefs: ["seg_4", "seg_5"],
      },
    ],
    reservations: [
      {
        kind: "evidence",
        title: "Najnowsza rola słabiej pokazuje rezultaty",
        explanation: "VertexPay zawiera ważne inicjatywy, ale punkty o Core Web Vitals, migracji i bibliotece komponentów nie podają obserwowalnego rezultatu ani mechanizmu poprawy.",
        evidenceRefs: ["seg_6", "seg_7"],
      },
      {
        kind: "evidence",
        title: "Granice indywidualnego ownershipu wymagają doprecyzowania",
        explanation: "Sformułowania „Pomagała stworzyć”, „Koordynowała” i „uczestniczyła w dyskusjach” pokazują udział w istotnych inicjatywach, ale nie rozdzielają jasno osobistych decyzji od pracy zespołu.",
        evidenceRefs: ["seg_4", "seg_5", "seg_9"],
      },
      {
        kind: "evidence",
        title: "Najmocniejszy dowód seniority znajduje się we wcześniejszej roli",
        explanation: "Najbardziej przekonujące liczby i decyzje architektoniczne są opisane przy Railbird Mobility, podczas gdy najnowsza rola zajmuje bardziej eksponowane miejsce, ale ma bardziej ogólne punkty.",
        evidenceRefs: ["seg_b", "seg_c"],
      },
    ],
    likelyInterviewQuestions: [
      {
        question: "Jakie decyzje techniczne przy migracji z Redux do hooks i React Query należały bezpośrednio do osoby aplikującej, a jakie były uzgodnione zespołowo?",
        whyThisQuestion: "CV opisuje zaplanowanie i dostarczenie migracji, ale nie pokazuje jej zakresu, ograniczeń ani konkretnych trade-offów.",
        evidenceRefs: ["seg_6"],
      },
      {
        question: "Jaki konkretny rezultat przyniosła biblioteka 28 komponentów i jaki był zakres osobistego wkładu w jej utworzenie?",
        whyThisQuestion: "Dokument podaje liczbę komponentów i adopcję, lecz nie opisuje wpływu na spójność, szybkość delivery, jakość ani odpowiedzialności za standardy.",
        evidenceRefs: ["seg_5"],
      },
      {
        question: "W jaki sposób mierzono poprawę Core Web Vitals i wydajności w VertexPay oraz jakie działania techniczne miały największy wpływ?",
        whyThisQuestion: "Najnowsza rola deklaruje poprawę wydajności, ale nie podaje wartości przed i po ani mechanizmu poprawy.",
        evidenceRefs: ["seg_7"],
      },
      {
        question: "Jakie były ograniczenia i kryteria etapowego rolloutu modernizacji onboardingu?",
        whyThisQuestion: "CV wskazuje na kontrole przed wydaniem i wdrożenie bez zakłócenia onboardingu, ale nie wyjaśnia decyzji, ryzyk ani zakresu koordynacji.",
        evidenceRefs: ["seg_rollout"],
      },
    ],
  },
  categoryScores,
  recruiterSimulation: {
    after5Seconds: "Senior Frontend Engineer z około ośmioma latami doświadczenia, skoncentrowany na React, TypeScript, wydajności, dostępności i architekturze UI.",
    after10Seconds: "Wyróżniają się konkretny wynik wydajnościowy — spadek p75 LCP z 4,4 s do 2,5 s — oraz doświadczenie w RFC i podziale dużej aplikacji na moduły domenowe.",
    after20Seconds: "Profil daje dobry powód do rozmowy na poziomie Senior Frontend, ale pojawia się pytanie, czy najnowsza rola miała porównywalny wpływ i zakres ownershipu, ponieważ jej rezultaty są opisane mniej konkretnie.",
    simulatedDecision: "interview",
    confidence: "high",
    reasons: [
      "Rezultat wydajnościowy jest mierzalny i połączony z konkretnym mechanizmem technicznym.",
      "RFC i uzgodnienie z zespołami backendowymi i platformowymi pokazują wpływ architektoniczny.",
      "Najnowsza rola pokazuje szeroki zakres współpracy, nawet jeśli rezultaty są opisane mniej konkretnie.",
    ],
    whatCouldImproveDecision: [
      "Doprecyzowanie rezultatów i osobistych decyzji w najnowszej roli VertexPay.",
      "Lepsze wyeksponowanie najmocniejszych dowodów bez sugerowania, że rezultaty z Railbird Mobility należą do VertexPay.",
    ],
  },
  strengths: [
    {
      id: "s1",
      title: "Rezultat wydajnościowy połączony z mechanizmem",
      explanation: "Dokument nie ogranicza się do deklaracji poprawy performance: podaje zmianę p75 LCP, wpływ na porzucenia rezerwacji oraz zastosowane działania techniczne.",
      evidenceRefs: ["seg_b"],
    },
    {
      id: "s2",
      title: "Dowód decyzji architektonicznej",
      explanation: "RFC dotyczące modułów domenowych i doprowadzenie do uzgodnienia rozwiązania z innymi zespołami pokazują pracę nad strukturą większej aplikacji frontendowej.",
      evidenceRefs: ["seg_c"],
    },
    {
      id: "s3",
      title: "Frontendowa jakość obejmująca testy i dostępność",
      explanation: "Wprowadzenie Playwright do procesu wydań oraz konkretne poprawy nawigacji klawiaturą i obsługi błędów formularzy wzmacniają wiarygodność profilu.",
      evidenceRefs: ["seg_a11y"],
    },
    {
      id: "s4",
      title: "Doświadczenie z rozwiązaniami współdzielonymi",
      explanation: "Biblioteka 28 komponentów i wzorce dla formularzy, nawigacji, walidacji oraz stanów informacji zwrotnej pokazują szerszy wpływ niż praca nad pojedynczą funkcją.",
      evidenceRefs: ["seg_5", "seg_patterns"],
    },
  ],
  issues: [
    {
      id: "i1",
      severity: "important",
      category: "impact",
      title: "Najnowsza rola deklaruje poprawę, ale nie pokazuje jej konsekwencji",
      explanation: "Punkty VertexPay mówią o poprawie Core Web Vitals, bibliotece komponentów i migracji, lecz nie pokazują wartości przed i po, redukcji regresji, skrócenia delivery ani innego obserwowalnego skutku. Wcześniejsza rola zawiera znacznie mocniejszy dowód wpływu.",
      whyItMatters: "Przy target Senior rekruter potrzebuje zobaczyć, że wpływ i rezultaty są aktualne, a nie tylko związane z wcześniejszym doświadczeniem.",
      evidenceRefs: ["seg_5", "seg_6", "seg_7", "seg_b"],
      confidence: "high",
      action: "Ustal dla każdej kluczowej inicjatywy VertexPay konkretną obserwowalną konsekwencję, a następnie dodaj ją do odpowiedniego punktu wyłącznie wtedy, gdy wynika z faktycznych danych lub możliwego do potwierdzenia efektu.",
      suggestion: {
        type: "question",
        original: evidence.seg_7,
        proposed: null,
        factualityNote: "CV nie zawiera danych pozwalających bezpiecznie utworzyć mocniejszy rewrite bez dopisania nieznanego faktu. Jaka była wartość Core Web Vitals przed i po zmianie w VertexPay?",
      },
    },
    {
      id: "i2",
      severity: "important",
      category: "ownership",
      title: "Granice indywidualnego ownershipu są niejasne w najważniejszych inicjatywach",
      explanation: "W VertexPay występują sformułowania „Koordynowała”, „Pomagała stworzyć” i „uczestniczyła w dyskusjach architektonicznych”. Pokazują one udział w ważnych pracach, ale nie wyjaśniają, które decyzje, elementy implementacji i uzgodnienia należały bezpośrednio do osoby aplikującej.",
      whyItMatters: "Niejasny podział odpowiedzialności może osłabić odbiór poziomu Senior, nawet gdy sama inicjatywa ma odpowiedni zakres.",
      evidenceRefs: ["seg_4", "seg_5", "seg_9", "seg_patterns"],
      confidence: "high",
      action: "Doprecyzuj osobiste decyzje, zakres implementacji i odpowiedzialność za uzgodnienia w redesignie onboardingu oraz bibliotece komponentów przed zmianą czasowników opisujących wkład.",
      suggestion: {
        type: "question",
        original: evidence.seg_5,
        proposed: null,
        factualityNote: "Nie należy zastępować „Pomagała stworzyć” mocniejszym czasownikiem bez potwierdzenia rzeczywistego zakresu ownershipu. Które decyzje dotyczące biblioteki komponentów należały bezpośrednio do Ciebie?",
      },
    },
    {
      id: "i3",
      severity: "important",
      category: "clarity",
      title: "Najmocniejsze dowody są słabiej eksponowane względem najnowszej roli",
      explanation: "Najbardziej konkretne osiągnięcia — wynik LCP, wpływ na porzucenia rezerwacji i RFC architektoniczne — znajdują się przy Railbird Mobility. Przy VertexPay, które jest pierwszą i najbardziej eksponowaną rolą, dominują opisy koordynacji, tworzenia funkcji i pomocy.",
      whyItMatters: "Pierwszy ogląd CV może sugerować mniejszą aktualną sprawczość niż wynika z całego dokumentu.",
      evidenceRefs: ["seg_4", "seg_5", "seg_6", "seg_8", "seg_b", "seg_c"],
      confidence: "high",
      action: "Przenieś rezultat LCP i RFC bliżej podsumowania, zachowując ich przypisanie do roli Senior Frontend Engineer w Railbird Mobility.",
      suggestion: {
        type: "expose",
        original: evidence.seg_b,
        proposed: "Zmniejszenie p75 LCP procesu rezerwacji z 4,4 s do 2,5 s oraz ograniczenie porzuceń rezerwacji mobilnych o 10%, a także RFC podziału aplikacji na moduły domenowe uzgodnione z zespołami backendowymi i platformowymi — najmocniejsze dowody seniority w tym dokumencie — warto wyeksponować bliżej podsumowania, z zachowaniem przypisania do roli Senior Frontend Engineer w Railbird Mobility.",
        factualityNote: "Ta zmiana wykorzystuje wyłącznie istniejące fakty; zmienia się ich ekspozycja, a przypisanie do Railbird Mobility zostaje zachowane, żeby wynik nie wyglądał na osiągnięcie z VertexPay.",
      },
    },
  ],
  ats: {
    score: 100,
    checks: [
      { id: "text_layer", status: "pass" }, { id: "reading_order", status: "pass" }, { id: "sections", status: "pass" },
      { id: "dates_titles", status: "pass" }, { id: "contact_info", status: "pass" }, { id: "layout_columns", status: "pass" },
      { id: "glyph_artifacts", status: "pass" }, { id: "date_format", status: "pass" },
    ],
  },
  jobMatch: null,
  nextSteps: [
    { priority: 1, title: "Doprecyzuj wpływ najnowszej roli", action: "Ustal i dodaj do punktów VertexPay weryfikowalne rezultaty poprawy wydajności, migracji oraz biblioteki komponentów, bez tworzenia nowych lub niepotwierdzonych metryk.", expectedImpact: "high" },
    { priority: 2, title: "Wyjaśnij osobisty zakres odpowiedzialności", action: "Rozdziel w opisach VertexPay własne decyzje i działania od pracy zespołu, szczególnie przy onboardingu, bibliotece komponentów i rolloucie migracji.", expectedImpact: "high" },
    { priority: 3, title: "Wzmocnij hierarchię istniejących dowodów", action: "Przenieś lub wyróżnij rezultat LCP i RFC w podsumowaniu osiągnięć, zachowując jednoznaczne przypisanie tych faktów do Railbird Mobility.", expectedImpact: "medium" },
  ],
  limitations: [
    "Analiza dotyczy wyłącznie informacji widocznych w przykładowym dokumencie.",
    "Symulacja pierwszego wrażenia nie przewiduje wyniku konkretnej rekrutacji.",
    "Wszystkie dane osoby, firm i rezultatów w tym przykładzie są fikcyjne.",
  ],
};
