import { describe, expect, it } from "vitest";
import { classifyNotACvReason, detectLikelyCv, getNotACvDiagnostics, NotACvError, validateCvText } from "@/lib/document-parsing/cv-detection";

describe("token-free CV detection", () => {
  it("accepts a structured Polish CV", () => {
    const text = `
      Profil zawodowy
      Senior Frontend Developer z siedmioletnim doświadczeniem w React i TypeScript.

      Doświadczenie zawodowe
      Lumina Commerce — Senior Frontend Developer, 2022–obecnie
      • Prowadzenie migracji checkoutu do Next.js i pomiar Web Vitals.
      • Mentoring zespołu oraz uzgadnianie decyzji architektonicznych.

      Wykształcenie
      Informatyka, 2015–2019

      Umiejętności
      React, TypeScript, Next.js, Playwright, CI/CD.
    `;
    expect(detectLikelyCv(text)).toMatchObject({ isLikelyCv: true, confidence: "high" });
  });

  it("accepts an English resume", () => {
    const text = `
      Professional summary
      Frontend Engineer focused on accessible commerce applications.

      Work history
      Fieldnote Systems — Software Engineer, 2020 to 2024
      - Built reporting workflows in React and TypeScript.
      - Introduced performance budgets and component tests.

      Education
      Bachelor degree in Computer Science, 2016 to 2020

      Skills
      React, TypeScript, Next.js, testing and accessibility.
    `;
    expect(detectLikelyCv(text).isLikelyCv).toBe(true);
  });

  it("accepts Polish section names after text extraction removes diacritics", () => {
    const text = `
      Profil zawodowy
      Frontend Developer z siedmioletnim doswiadczeniem w aplikacjach SaaS.

      Doswiadczenie zawodowe
      Sample Systems - Frontend Developer, 2020-obecnie
      - Rozwoj aplikacji React i TypeScript dla klientow biznesowych.
      - Utrzymanie testow, CI oraz standardow dostepnosci.

      Wyksztalcenie
      Informatyka, 2016-2020

      Umiejetnosci
      React, TypeScript, Next.js, testy automatyczne i CI/CD.
    `;
    expect(detectLikelyCv(text)).toMatchObject({ isLikelyCv: true, confidence: "high" });
  });

  it("accepts a concise CV when its structure, role and career dates are explicit", () => {
    const text = `
      Nina Demo - Frontend Developer
      Doswiadczenie zawodowe
      Frontend Developer, Test Labs, 2024-obecnie. Tworzenie interfejsow React i testow.
      Umiejetnosci
      React, TypeScript, CSS, Git.
      Wyksztalcenie
      Informatyka, 2020-2024.
    `;
    expect(detectLikelyCv(text)).toMatchObject({ isLikelyCv: true, confidence: "high" });
  });

  it("rejects an invoice without spending model tokens", () => {
    const text = `
      FAKTURA VAT 12/2026
      Data wystawienia: 8 sierpnia 2026. Termin płatności: 22 sierpnia 2026.
      Sprzedawca: Testowa Spółka. Nabywca: Przykładowy Klient.
      Pozycje: konsultacja, abonament, utrzymanie. Razem netto 1200 PLN, VAT 276 PLN,
      razem brutto 1476 PLN. Numer rachunku i warunki płatności znajdują się poniżej.
      Dokument wygenerowany elektronicznie i nie wymaga podpisu.
    `;
    expect(detectLikelyCv(text).isLikelyCv).toBe(false);
  });

  it("rejects documents that would create an excessive prompt", () => {
    expect(() => validateCvText("Doświadczenie Developer 2020–2024 Umiejętności ".repeat(100), 500)).toThrow("DOCUMENT_TEXT_TOO_LONG");
  });
});

describe("not-a-CV rejection reason", () => {
  // These four cases exist so a rejection trend can be told apart from a document that just
  // missed the score threshold — every case must stay text-free per PRIVACY_AND_RETENTION.md.
  it("classifies a too-short document", () => {
    expect(classifyNotACvReason(detectLikelyCv("Za krótki dokument."))).toBe("too_short");
  });

  it("classifies a document with structure but no career anchor", () => {
    const text = `
      Wykształcenie: Politechnika Warszawska, kierunek Informatyka.
      Umiejętności: znajomość języków programowania, pracy zespołowej oraz metodyk zwinnych.
      Języki obce: angielski na poziomie zaawansowanym, niemiecki na poziomie podstawowym.
    `;
    const result = detectLikelyCv(text);
    expect(result).toMatchObject({ isLikelyCv: false, hasCareerAnchor: false, hasEnoughStructure: true });
    expect(classifyNotACvReason(result)).toBe("no_career_anchor");
  });

  it("classifies a career anchor with too little surrounding structure", () => {
    const text = `
      Doświadczenie zawodowe obejmuje wieloletnią pracę przy tworzeniu rozwiązań dla klientów,
      w tym prowadzenie projektów wewnętrznych oraz koordynację działań zespołu odpowiedzialnego
      za wdrożenia w kilku równoległych inicjatywach organizacji.
    `;
    const result = detectLikelyCv(text);
    expect(result).toMatchObject({ isLikelyCv: false, hasCareerAnchor: true, hasEnoughStructure: false });
    expect(classifyNotACvReason(result)).toBe("insufficient_structure");
  });

  it("classifies a document that clears both gates but not the score threshold", () => {
    const text = `
      Doświadczenie zawodowe obejmuje pracę przy różnych projektach technologicznych oraz
      udział w rozwoju produktów cyfrowych na rzecz wielu klientów.
      Umiejętności obejmują znajomość nowoczesnych narzędzi oraz metod pracy zespołowej.
    `;
    const result = detectLikelyCv(text);
    expect(result).toMatchObject({ isLikelyCv: false, hasCareerAnchor: true, hasEnoughStructure: true });
    expect(result.score).toBeLessThan(6);
    expect(classifyNotACvReason(result)).toBe("low_score");
  });

  it("attaches score, confidence, signals and reason to a thrown NotACvError, never the text", () => {
    try {
      validateCvText("Za krótki dokument.");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(NotACvError);
      const diagnostics = getNotACvDiagnostics(error);
      expect(diagnostics).toEqual({ score: 0, confidence: "low", signals: ["too_short"], reason: "too_short" });
      expect(JSON.stringify(diagnostics)).not.toContain("krótki");
    }
  });

  it("returns undefined diagnostics for an unrelated error", () => {
    expect(getNotACvDiagnostics(new Error("DOCUMENT_TEXT_TOO_LONG"))).toBeUndefined();
  });
});
