import type { CVReport } from "./schemas/report";
import { careerContextLabels, type CareerContext } from "./career-context";
import { getReviewPrompt } from "./prompts";
import { calculateOverall } from "./validate-report";
import { getRubric, RUBRIC_VERSION, type Seniority } from "@/lib/rubrics/technical-v1";
import { getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

export const CAREER_SAMPLE_IDS = ["first_job", "junior", "mid", "senior", "lead"] as const;
export type CareerSampleId = (typeof CAREER_SAMPLE_IDS)[number] | "bootcamp";
export function parseCareerSample(value: unknown): CareerSampleId {
  if (value === "bootcamp") return "first_job";
  return (CAREER_SAMPLE_IDS as readonly string[]).includes(value as string) ? value as CareerSampleId : "senior";
}
export const careerSampleLabels: Record<Locale, Record<CareerSampleId, string>> = {
  pl: { first_job: "Pierwsza praca", bootcamp: "Pierwsza praca", junior: "Junior", mid: "Mid", senior: "Senior", lead: "Lead" },
  en: { first_job: "First job", bootcamp: "First job", junior: "Junior", mid: "Mid", senior: "Senior", lead: "Lead" },
};

type Copy = { evidence: string[]; profile: string; verdict: string; issue: string; action: string; question: string };
const samples: Record<CareerSampleId, Record<Locale, Copy>> = {
  first_job: {
    pl: {
      evidence: [
        "Projekt własny: wyszukiwarka wydarzeń. Samodzielna implementacja filtrów w React i TypeScript, rozdzielenie pobierania danych od widoków, obsługa błędów API i testy filtrów.",
        "Projekt zespołowy: planer nauki. Odpowiedzialność za formularze i walidację, nawigację klawiaturą oraz testy; uzgodnienie kontraktu API z drugą osobą i wzajemne code review.",
        "Podsumowanie: szukam pierwszej pracy jako Junior Frontend Developer. Brak doświadczenia komercyjnego.\nKursy: React i TypeScript.\nZainteresowania: aplikacje webowe.",
      ],
      profile: "Profil osoby szukającej pierwszej pracy, z konkretnymi projektami i udokumentowanym własnym wkładem.",
      verdict: "CV pokazuje dobre podstawy do roli Junior; warto wcześniej pokazać projekty.",
      issue: "Projekty są mniej widoczne niż kursy i zainteresowania",
      action: "Przenieś opisy wyszukiwarki wydarzeń i planera nauki przed sekcję kursów i zainteresowań.",
      question: "Dlaczego w wyszukiwarce rozdzielono pobieranie danych od widoków?",
    },
    en: {
      evidence: [
        "Personal project: event search. Independently implemented filters in React and TypeScript, separated data fetching from views, handled API errors and tested the filters.",
        "Team project: study planner. Responsible for forms and validation, keyboard navigation and tests; agreed the API contract with a teammate and exchanged code reviews.",
        "Summary: seeking a first job as a Junior Frontend Developer. No commercial experience.\nCourses: React and TypeScript.\nInterests: web applications.",
      ],
      profile: "A first-job profile with concrete projects and documented personal contribution.",
      verdict: "The CV shows a solid basis for a Junior role; bring the projects forward.",
      issue: "Projects are less visible than courses and interests",
      action: "Move the event-search and study-planner descriptions above the courses and interests sections.",
      question: "Why did you separate data fetching from views in the event-search project?",
    },
  },
  bootcamp: {
    pl: {
      evidence: [
        "Projekt bootcampowy: wyszukiwarka wydarzeń w React i TypeScript. Po części prowadzonej według instrukcji samodzielne dodanie filtrów, obsługi błędów API i testów; rozdzielenie pobierania danych od widoków.",
        "Zespołowy projekt końcowy bootcampu: planer nauki. Własny zakres: formularze, walidacja i nawigacja klawiaturą; testy, uzgodnienie kontraktu API z drugą osobą i wzajemne code review.",
        "Podsumowanie: pierwsza praca po bootcampie, Junior Frontend Developer. Brak doświadczenia komercyjnego.\nCertyfikaty: ukończony bootcamp frontendowy.\nZainteresowania: aplikacje webowe.",
      ],
      profile: "Profil absolwenta bootcampu, którego CV rozróżnia część kursową od samodzielnych rozszerzeń i własnego wkładu w projekt zespołowy.",
      verdict: "Własne rozszerzenia i projekt zespołowy dobrze wspierają aplikację na Juniora.",
      issue: "Certyfikaty przesłaniają dowody własnej pracy",
      action: "Przenieś projekty przed certyfikaty, zachowując rozróżnienie części kursowej i samodzielnych rozszerzeń.",
      question: "Dlaczego po części kursowej dodano obsługę błędów API i jak ją sprawdzono?",
    },
    en: {
      evidence: [
        "Bootcamp project: event search in React and TypeScript. After the guided part, independently added filters, API error handling and tests; separated data fetching from views.",
        "Bootcamp team capstone: study planner. Personal scope: forms, validation and keyboard navigation; tests, an API contract agreed with a teammate and exchanged code reviews.",
        "Summary: first job after a bootcamp, Junior Frontend Developer. No commercial experience.\nCertificates: frontend bootcamp completion.\nInterests: web applications.",
      ],
      profile: "A bootcamp graduate profile that separates guided work from independent extensions and personal contribution to a team project.",
      verdict: "Independent extensions and the team project provide strong evidence for a Junior application.",
      issue: "Certificates overshadow evidence of personal work",
      action: "Move projects above certificates while keeping guided work separate from independent extensions.",
      question: "Why did you add API error handling after the guided part and how did you test it?",
    },
  },
  junior: {
    pl: {
      evidence: ["Staż: implementacja formularza rejestracji w React i TypeScript, walidacja i stany błędów; testy i wydanie po code review z opiekunem.", "Projekt własny: planer nauki. Podział na komponenty, testy filtrów, nawigacja klawiaturą i obsługa błędów API; omówienie rozwiązania z drugą osobą.", "Podsumowanie: Junior Frontend Developer.\nZainteresowania: aplikacje webowe."],
      profile: "Profil Juniora z konkretnym wykonaniem podczas stażu i własnym projektem.", verdict: "CV pokazuje wykonanie i dbałość o jakość odpowiednie dla Juniora.", issue: "Projekt własny jest ukryty za zainteresowaniami", action: "Przenieś opis planera nauki przed zainteresowania, zachowując oznaczenie projektu własnego.", question: "Jakie uwagi z code review formularza uwzględniono przed wydaniem?",
    },
    en: {
      evidence: ["Internship: implemented a registration form in React and TypeScript, validation and error states; tests and a release after a mentor's code review.", "Personal project: study planner. Component structure, filter tests, keyboard navigation and API error handling; discussed the solution with a peer.", "Summary: Junior Frontend Developer.\nInterests: web applications."],
      profile: "A Junior profile with concrete internship delivery and a personal project.", verdict: "The CV shows execution and attention to quality appropriate for a Junior.", issue: "The personal project is hidden behind interests", action: "Move the study-planner description above interests while retaining its personal-project attribution.", question: "Which registration-form code review comments did you address before release?",
    },
  },
  mid: {
    pl: {
      evidence: ["Frontend Developer: samodzielne dostarczenie panelu rezerwacji w React i TypeScript, kontrakt API uzgodniony z backendem, oddzielenie stanu serwera od formularzy i testy krytycznych ścieżek.", "W tej samej roli: usunięcie podwójnego wysłania formularza przez blokadę ponownego żądania; test regresji i współpraca z QA przy wydaniu.", "Podsumowanie: Mid Frontend Developer.\nNarzędzia: React i TypeScript."],
      profile: "Profil Mida z samodzielnym dostarczaniem funkcji i konkretnym rozwiązaniem problemu jakości.", verdict: "Samodzielność i opisane decyzje dobrze wspierają poziom Mid.", issue: "Rozwiązanie problemu jest mniej widoczne niż lista narzędzi", action: "Przenieś opis usunięcia podwójnego wysłania formularza przed listę narzędzi w tej samej roli.", question: "Dlaczego wybrano blokadę ponownego żądania i jakie przypadki obejmuje test regresji?",
    },
    en: {
      evidence: ["Frontend Developer: independently delivered a booking dashboard in React and TypeScript, agreed the API contract with backend, separated server state from forms and tested critical paths.", "In the same role: eliminated duplicate form submission by blocking repeat requests; added a regression test and collaborated with QA on the release.", "Summary: Mid Frontend Developer.\nTools: React and TypeScript."],
      profile: "A Mid profile with independent feature delivery and a concrete quality improvement.", verdict: "Independent delivery and contextual decisions provide good evidence for Mid.", issue: "The problem solved is less visible than the tools list", action: "Move the duplicate-submission fix above the tools list within the same role.", question: "Why did you choose to block repeat requests and which cases does the regression test cover?",
    },
  },
  senior: {
    pl: {
      evidence: ["Senior Frontend Engineer: odpowiedzialność za migrację procesu rezerwacji; porównanie etapowego rolloutu z pełną podmianą, wybór etapów ze względu na ryzyko i testy krytycznych ścieżek z QA.", "W tej samej roli: wspólny standard walidacji formularzy uzgodniony z product i backendem; usunięcie niespójnych komunikatów błędów, code review i wspieranie wdrażania standardu w zespole.", "Podsumowanie: Senior Frontend Engineer.\nNarzędzia: React i TypeScript."],
      profile: "Profil Seniora z odpowiedzialnością za migrację, decyzjami o ryzyku i wpływem na standardy zespołu.", verdict: "Decyzje i odpowiedzialność dobrze wspierają poziom Senior.", issue: "Uzasadnienie rolloutu jest mniej widoczne niż lista narzędzi", action: "Przenieś porównanie wariantów rolloutu przed listę narzędzi, zachowując kontekst migracji.", question: "Jakie ryzyka przesądziły o wyborze etapowego rolloutu?",
    },
    en: {
      evidence: ["Senior Frontend Engineer: owned a booking-flow migration; compared staged rollout with full replacement, chose stages because of risk and tested critical paths with QA.", "In the same role: agreed a shared form-validation standard with product and backend; removed inconsistent error messages, reviewed code and supported adoption within the team.", "Summary: Senior Frontend Engineer.\nTools: React and TypeScript."],
      profile: "A Senior profile with migration responsibility, risk decisions and influence on team standards.", verdict: "Decisions and responsibility provide good evidence for Senior.", issue: "Rollout reasoning is less visible than the tools list", action: "Move the rollout comparison above the tools list while preserving the migration context.", question: "Which risks determined the choice of a staged rollout?",
    },
  },
  lead: {
    pl: {
      evidence: ["Frontend Lead: uzgodnienie kierunku migracji z product, backendem i QA; podział prac między trzy osoby, uzgodnienie etapów i kontrola ryzyka przy wydaniu procesu rezerwacji.", "W tej samej roli: wspólny standard walidacji formularzy, prowadzenie przeglądów projektu i mentoring przy wdrożeniu; zespół zastąpił niespójne komunikaty wspólnymi wzorcami.", "Podsumowanie: Frontend Lead.\nNarzędzia: React i TypeScript."],
      profile: "Profil technicznego Leada z koordynacją, uzgodnieniami i rezultatem dostarczonym przez zespół.", verdict: "Kierunek techniczny i praca przez zespół wspierają poziom Lead.", issue: "Kierunek techniczny jest mniej widoczny niż lista narzędzi", action: "Przenieś opis uzgodnienia kierunku migracji przed listę narzędzi w tej samej roli.", question: "Jak uzgodniono etapy migracji między product, backendem i QA?",
    },
    en: {
      evidence: ["Frontend Lead: agreed migration direction with product, backend and QA; split work among three engineers, agreed stages and controlled release risk for the booking flow.", "In the same role: a shared form-validation standard, facilitated design reviews and mentored adoption; the team replaced inconsistent messages with shared patterns.", "Summary: Frontend Lead.\nTools: React and TypeScript."],
      profile: "A technical Lead profile with coordination, agreements and an outcome delivered through the team.", verdict: "Technical direction and delivery through others support Lead.", issue: "Technical direction is less visible than the tools list", action: "Move the migration-direction agreements above the tools list within the same role.", question: "How did you agree the migration stages with product, backend and QA?",
    },
  },
};

export function careerSampleSource(id: CareerSampleId, locale: Locale): string {
  const evidence = samples[id][locale].evidence;
  return [evidence[2], evidence[0], evidence[1]].join("\n\n");
}

export function createCareerSample(id: CareerSampleId, locale: Locale, targetRole: TargetRoleId = "frontend_developer"): CVReport {
  id = parseCareerSample(id);
  const text = samples[id][locale];
  const level: Exclude<Seniority, "auto" | "first_job"> = id === "first_job" || id === "bootcamp" ? "junior" : id;
  const context: CareerContext = id === "first_job" ? "first_job" : "standard";
  const stage: Seniority = id === "first_job" ? "first_job" : level;
  const role = getTargetRoleProfile(targetRole, locale);
  const evidenceMap = Object.fromEntries(text.evidence.map((value, i) => [`seg_example_${i + 1}`, value]));
  const refs = ["seg_example_1", "seg_example_2"];
  const pl = locale === "pl";
  const scores = level === "junior"
    ? { impact: 84, ownership: 86, credibility: 88, architecture: 82, collaboration: 84, clarity: 78 }
    : level === "mid"
      ? { impact: 86, ownership: 88, credibility: 88, architecture: 84, collaboration: 86, clarity: 78 }
      : { impact: 86, ownership: 88, credibility: 84, architecture: 86, collaboration: 88, clarity: 78 };
  const categoryRefs: Record<string, string[]> = {
    impact: refs, ownership: refs, credibility: refs, architecture: ["seg_example_1"],
    collaboration: level === "junior" ? ["seg_example_2"] : refs, clarity: ["seg_example_3"],
  };
  const rationales: Record<string, string> = pl ? {
    impact: level === "junior" ? "Działające funkcje, obsługa błędów i testy pokazują efekty pracy w skali projektu. Nie jest potrzebna metryka biznesowa." : "Opis pokazuje dostarczone rozwiązanie oraz konkretną zmianę jakości lub sposobu pracy.",
    ownership: level === "junior" ? "CV nazywa własny zakres implementacji, oddzielając go od udziału innych osób lub pomocy opiekuna." : level === "mid" ? "Samodzielne dostarczenie panelu i rozwiązanie problemu formularza pokazują odpowiedzialność za własny zakres." : "CV nazywa odpowiedzialność za migrację oraz działanie przy standardzie zespołu.",
    credibility: level === "junior" ? "Implementacja, testy i obsługa błędów są dowodami praktyki, a nie samą listą technologii." : "Opis wiąże działania techniczne z dostarczeniem rozwiązania i sprawdzeniem jego jakości.",
    architecture: level === "junior" ? "Projekt pokazuje świadomy podział kodu lub pracę nad strukturą rozwiązania na poziomie początkującym." : level === "mid" ? "Oddzielenie stanu serwera od formularzy pokazuje konkretną decyzję dotyczącą struktury panelu." : "Plan migracji i uzgodnienia pokazują decyzje dotyczące sposobu dostarczenia większej zmiany.",
    collaboration: level === "junior" ? "Opis współpracy przy projekcie pokazuje uzgodnienia, przegląd lub omówienie rozwiązania." : "CV pokazuje współpracę i uzgodnienia z innymi rolami przy dostarczeniu rozwiązania.",
    clarity: text.issue,
  } : {
    impact: level === "junior" ? "Working features, error handling and tests show project-scale outcomes. A business metric is not required." : "The description shows a delivered solution and a concrete change in quality or working practices.",
    ownership: level === "junior" ? "The CV identifies personal implementation scope separately from other contributors or a mentor's support." : level === "mid" ? "Independent dashboard delivery and fixing the form problem show responsibility for a defined scope." : "The CV identifies responsibility for the migration and work on a team standard.",
    credibility: level === "junior" ? "Implementation, tests and error handling evidence practice rather than a technology list alone." : "Technical actions are linked to delivery and checking solution quality.",
    architecture: level === "junior" ? "The project shows deliberate code organisation or solution structure appropriate for an entry-level role." : level === "mid" ? "Separating server state from forms shows a concrete decision about dashboard structure." : "The migration plan and agreements show decisions about delivering a larger change.",
    collaboration: level === "junior" ? "The project description shows collaboration through agreements, review or discussing a solution." : "The CV shows collaboration and agreements with adjacent roles during delivery.",
    clarity: text.issue,
  };
  const categoryScores = getRubric(level, targetRole, locale).map(category => ({
    ...category, score: scores[category.key as keyof typeof scores],
    rationale: rationales[category.key], evidenceRefs: categoryRefs[category.key],
  }));
  return {
    version: "2.1.0", locale, rubricVersion: RUBRIC_VERSION, promptVersion: getReviewPrompt(locale, stage).version, evidenceMap,
    document: { detectedLanguage: locale, parseQuality: "good", targetRole: role.label, targetSeniority: stage, careerContext: context, perceivedRole: role.label, perceivedSeniority: level, perceivedSeniorityConfidence: "high" },
    summary: { overallScore: calculateOverall(categoryScores), oneSentenceVerdict: text.verdict, strongestSignal: text.evidence[0], biggestRisk: text.issue },
    recruiterPerspective: {
      profileSummary: text.profile, seniorityAlignment: "aligned", seniorityAlignmentExplanation: text.verdict,
      positiveSignals: refs.map((ref, i) => ({ title: pl ? `Konkretny dowód ${i + 1}` : `Concrete evidence ${i + 1}`, explanation: text.evidence[i], evidenceRefs: [ref] })),
      reservations: [{ kind: "evidence", title: text.issue, explanation: text.issue, evidenceRefs: ["seg_example_3"] }],
      likelyInterviewQuestions: [{ question: text.question, whyThisQuestion: pl ? "Pytanie doprecyzowuje opisane działanie, bez zakładania nowego faktu." : "The question clarifies a documented action without presuming a new fact.", evidenceRefs: ["seg_example_1"] }],
    },
    categoryScores,
    recruiterSimulation: { after5Seconds: `${role.label}, ${level}. ${text.profile}`, after10Seconds: text.evidence[0], after20Seconds: `${text.verdict} ${text.issue}.`, simulatedDecision: "interview", confidence: "medium", reasons: [text.verdict], whatCouldImproveDecision: [text.action] },
    strengths: refs.map((ref, i) => ({ id: `s${i + 1}`, title: pl ? `Udokumentowany wkład ${i + 1}` : `Documented contribution ${i + 1}`, explanation: text.evidence[i], evidenceRefs: [ref] })),
    issues: [{ id: "i1", severity: "important", category: "clarity", title: text.issue, explanation: text.issue, whyItMatters: pl ? "Pierwszy skan dokumentu może pominąć dowody odpowiednie dla wybranego poziomu." : "An initial scan may miss evidence appropriate for the selected level.", evidenceRefs: ["seg_example_3"], confidence: "high", action: text.action, suggestion: { type: "expose", original: text.evidence[0], proposed: null, factualityNote: pl ? "Zmiana kolejności wykorzystuje istniejące informacje i zachowuje kontekst projektu lub roli." : "Reordering uses existing information and preserves project or role attribution." } }],
    jobMatch: null, nextSteps: [{ priority: 1, title: text.issue, action: text.action, expectedImpact: "high" }],
    limitations: pl ? ["Wszystkie dane w tym przykładzie są fikcyjne.", "Wynik opisuje jakość dowodów w CV względem wybranego poziomu, nie rzeczywiste kompetencje ani szanse zatrudnienia.", `Kontekst: ${careerContextLabels.pl[context]}.`] : ["All data in this example is fictional.", "The score describes CV evidence quality against the selected level, not real competence or hiring probability.", `Context: ${careerContextLabels.en[context]}.`],
  };
}
