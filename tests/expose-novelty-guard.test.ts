import { describe, expect, it } from "vitest";
import { validateEvidence } from "@/lib/ai/validate-report";
import { createMockReport } from "@/lib/ai/mock-report";

// Verbatim evidence and a faithful EXPOSE proposal from a real v1.6-rc3 run
// (gpt-5.6-luna, 2026-08-18 10:17). The model correctly classified this as
// EXPOSE — moving Railbird's measurable result next to the newest role — but
// the server downgraded it to QUESTION with "Doprecyzuj brakujące fakty…",
// even though every fact in the proposal traces to the cited evidence.
const evidenceMap = {
  seg_4: "Koordynowała dostarczenie frontendowej części redesignu procesu onboardingu klientów używanego przez trzy zespoły produktowe, współpracując z product, design i backendem.",
  seg_7: "Poprawiła Core Web Vitals i wydajność ładowania w procesach onboardingu oraz zarządzania kontem.",
  seg_8: "Tworzyła funkcje dla użytkowników, wykonywała code review i wspierała mniej doświadczonych frontend developerów w codziennych pytaniach technicznych.",
  seg_b: "Zmniejszyła p75 LCP w mobilnym procesie rezerwacji z 4,4 s do 2,5 s oraz ograniczyła porzucanie rezerwacji mobilnych o 10% dzięki route-level code splitting, optymalizacji obrazów i performance budgets w CI.",
};
const proposed = "Zmniejszenie p75 LCP w procesie rezerwacji z 4,4 s do 2,5 s oraz ograniczenie porzuceń mobilnych rezerwacji o 10%, osiągnięte dzięki route-level code splitting i performance budgets w CI, warto wyeksponować obok najnowszego doświadczenia.";

function reportWith(suggestion: { type: "expose" | "rewrite"; original: string; proposed: string; factualityNote: string }) {
  const input = createMockReport();
  input.evidenceMap = evidenceMap;
  input.issues = [{
    ...input.issues[0],
    id: "i3", severity: "important", confidence: "high", category: "clarity",
    title: "Najmocniejszy dowód seniority jest zakopany w starszej roli",
    evidenceRefs: ["seg_4", "seg_7", "seg_8", "seg_b"],
    action: "Przenieś najsilniejszy dowód wydajności z Railbird bliżej podsumowania, żeby był widoczny obok najnowszej roli.",
    suggestion,
  }];
  return validateEvidence(input, new Set(Object.keys(evidenceMap)), evidenceMap);
}

describe("EXPOSE/REWRITE novelty guard", () => {
  it("keeps a faithful EXPOSE as EXPOSE despite Polish inflection changing every word form", () => {
    const report = reportWith({
      type: "expose", original: evidenceMap.seg_8, proposed,
      factualityNote: "Ta zmiana wykorzystuje wyłącznie istniejące fakty; zmienia się ich ekspozycja, nie przypisanie do roli.",
    });
    expect(report.issues[0].suggestion?.type).toBe("expose");
    expect(report.issues[0].suggestion?.proposed).toBe(proposed);
  });

  it("still downgrades an EXPOSE that adds a genuinely fabricated claim", () => {
    // Same source evidence, but "mentoring" and "inicjatywy architektoniczne"
    // appear nowhere in it — real fabrication, not inflection or framing.
    const report = reportWith({
      type: "expose", original: evidenceMap.seg_8,
      proposed: "Prowadziła inicjatywy architektoniczne i mentoring zespołu, co warto wyeksponować obok najnowszego doświadczenia.",
      factualityNote: "Wymaga potwierdzenia.",
    });
    expect(report.issues[0].suggestion?.type).toBe("question");
    expect(report.issues[0].suggestion?.proposed).toBeNull();
  });

  it("still downgrades a rewrite that invents a number absent from every cited source", () => {
    const report = reportWith({
      type: "rewrite", original: evidenceMap.seg_8,
      proposed: "Wspierała 15 mniej doświadczonych programistów podczas code review.",
      factualityNote: "",
    });
    expect(report.issues[0].suggestion?.type).toBe("question");
  });
});
