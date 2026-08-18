import { describe, expect, it } from "vitest";
import { isMissingOfferFinding, validateEvidence } from "@/lib/ai/validate-report";
import { createMockReport } from "@/lib/ai/mock-report";

// Verbatim titles/explanations produced by the live model, from five separate runs.
const missingOffer = [
  { title: "Brak oferty do porównania", explanation: "Nie przekazano job description, więc wynik ATS dotyczy higieny dokumentu, a nie dopasowania do konkretnego ogłoszenia." },
  { title: "Brak konkretnego ogłoszenia do porównania", explanation: "Nie można ocenić, czy kolejność i dobór słów kluczowych odpowiadają wymaganiom konkretnej oferty pracy." },
  { title: "Brak job description do porównania", explanation: "Nie można ocenić, czy słowa kluczowe i kolejność treści odpowiadają konkretnemu ogłoszeniu." },
  { title: "Brak dopasowania do konkretnej oferty", explanation: "Nie przekazano job description, więc nie można ocenić zgodności z wymaganiami konkretnego ogłoszenia." },
  { title: "Brak konkretnej oferty pracy", explanation: "Nie można ocenić dopasowania słów kluczowych do wymagań konkretnego ogłoszenia, ponieważ oferta nie została przekazana." },
];

const genuineHygiene = [
  { title: "Standardowa struktura CV", explanation: "Dokument zawiera summary, skills, doświadczenie, projekty i edukację oraz rozpoznawalne nazwy technologii." },
  { title: "Nadmiernie szeroka sekcja technologii", explanation: "Duża liczba technologii nie jest powiązana z konkretnymi rolami ani projektami, co może obniżać precyzję dopasowania." },
  { title: "Niejasny zapis przy projekcie", explanation: "Fragment może być artefaktem formatowania lub ekstrakcji i warto go poprawić." },
  { title: "Czytelne daty i nazwy stanowisk", explanation: "Role, firmy, lokalizacje i przedziały dat są łatwe do rozpoznania przez systemy ATS." },
];

describe("ATS findings", () => {
  it.each(missingOffer)("treats %o as a missing-offer finding", (finding) => {
    expect(isMissingOfferFinding(finding)).toBe(true);
  });

  it.each(genuineHygiene)("keeps the genuine hygiene finding %o", (finding) => {
    expect(isMissingOfferFinding(finding)).toBe(false);
  });

  it("removes missing-offer findings when no job description was supplied", () => {
    const input = createMockReport();
    input.ats.findings = [...genuineHygiene, ...missingOffer].map((finding) => ({ ...finding, type: "warning" as const }));
    const report = validateEvidence(input, new Set(["seg_exp_1"]), input.evidenceMap);
    expect(report.ats.findings).toHaveLength(genuineHygiene.length);
    expect(JSON.stringify(report.ats.findings)).not.toContain("job description");
  });

  it("keeps offer-related findings for a paid job match, where they are legitimate", () => {
    const input = createMockReport();
    // A real keyword gap against an offer that was actually supplied.
    input.ats.findings = [{ type: "warning", title: "Brak silnego dopasowania do słów z oferty medycznej", explanation: "CV nie pokazuje wprost pojęć takich jak procedury medyczne czy sprawozdawczość oddziałowa." }];
    const report = validateEvidence(input, new Set(["seg_exp_1"]), input.evidenceMap, { jobDescriptionProvided: true });
    expect(report.ats.findings).toHaveLength(1);
  });
});
