import { describe, expect, it } from "vitest";
import { isWordingInstruction } from "@/lib/ai/proposed-wording";
import { normalizeReportRecommendations } from "@/lib/ai/report-recommendations";
import { createMockReport } from "@/lib/ai/mock-report";

describe("CV wording guard", () => {
  it.each([
    "Po uporządkowaniu repozytoriów dodaj w tej sekcji linki do kodu projektów.",
    "Dodaj link do repozytorium.", "„Sprawdź działanie formularza.”",
    "After organizing the repositories, add links to the project source code.",
    "Please include a working repository link.", "You should describe the tests.",
    "Projekt w React. Następnie dopisz wynik sprawdzeń.",
  ])("recognizes instructions: %s", text => expect(isWordingInstruction(text)).toBe(true));
  it.each([
    "Dodałam walidację pustego tytułu i sprawdziłam trzy scenariusze.",
    "Po sprawdzeniu formularza poprawiłem warunek walidacji.",
    'I implemented an "Add to cart" button and checked keyboard navigation.',
    'Zaimplementowałam przycisk „Dodaj do koszyka”.',
    "After checking the form, I added a validation message.",
    "Projekt: https://example.com/demo",
  ])("preserves CV statements: %s", text => expect(isWordingInstruction(text)).toBe(false));
  it("removes only the instruction draft, retaining advice, findings and grades", () => {
    const report = createMockReport("first_job", false, "frontend_developer", "pl");
    const issue = report.issues[0];
    issue.suggestion = { type: "rewrite", original: "Linki do kodu nie zostały dodane; repozytoria wymagają uporządkowania.", proposed: "Po uporządkowaniu repozytoriów dodaj w tej sekcji linki do kodu projektów.", factualityNote: "Linki nie zostały jeszcze dodane." };
    issue.action = "Uporządkuj repozytoria i dodaj linki, gdy będą gotowe.";
    const result = normalizeReportRecommendations(report);
    expect(result.issues[0].suggestion?.proposed).toBeNull();
    expect(result.issues[0].action).toBe(issue.action);
    expect(result.summary).toEqual(report.summary);
    expect(result.categoryScores).toEqual(report.categoryScores);
    expect(report.issues[0].suggestion?.proposed).not.toBeNull();
  });
});
