import { describe, expect, it } from "vitest";
import { isConcreteIssueAction, normalizeIssueAction } from "@/lib/ai/issue-action";

describe("issue action copy", () => {
  it.each(["Expose", "Gap", "Rewrite", "Question", "Expose additional frontend cases"])("rejects a suggestion label as an action: %s", (action) => {
    expect(isConcreteIssueAction(action)).toBe(false);
  });

  it.each([
    ["expose", "Przenieś istniejący w CV dowód"],
    ["gap", "Sprawdź, czy masz możliwy do potwierdzenia dowód"],
    ["rewrite", "Przepisz wskazany fragment"],
    ["question", "Doprecyzuj brakujące fakty"],
  ] as const)("creates a safe Polish fallback for %s", (suggestionType, expected) => {
    const action = normalizeIssueAction({ action: suggestionType, suggestionType, title: "Niejasny zakres odpowiedzialności", locale: "pl" });
    expect(action).toContain(expected);
    expect(isConcreteIssueAction(action)).toBe(true);
  });

  it("preserves a specific action returned by the model", () => {
    const action = "Przenieś opis budżetów wydajnościowych do podsumowania najnowszej roli.";
    expect(normalizeIssueAction({ action, suggestionType: "expose", title: "Specjalizacja jest ukryta", locale: "pl" })).toBe(action);
  });

  it("accepts a concrete imperative that begins with Rewrite", () => {
    expect(isConcreteIssueAction("Rewrite the summary to lead with the strongest verified ownership example.")).toBe(true);
  });
});
