export type IssueSuggestionType = "rewrite" | "expose" | "gap" | "question";

const suggestionLabelPattern = /^(?:rewrite|expose|gap|question)\s*[:.\-]?\s*$/i;

export function isConcreteIssueAction(action: string): boolean {
  const normalized = action.trim().replace(/\s+/g, " ");
  const words = normalized.match(/[\p{L}\p{N}]+/gu) || [];
  return normalized.length >= 28 && words.length >= 5 && !suggestionLabelPattern.test(normalized);
}

export function normalizeIssueAction(input: {
  action: string;
  suggestionType: IssueSuggestionType | null | undefined;
  title: string;
  locale: "pl" | "en";
  factualityNote?: string | null;
}): string {
  const action = input.action.trim().replace(/\s+/g, " ");
  if (isConcreteIssueAction(action)) return action;

  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 180);
  const note = input.factualityNote?.trim().replace(/\s+/g, " ");
  const usableQuestion = note && note.endsWith("?") ? note : null;

  if (input.locale === "en") {
    if (input.suggestionType === "rewrite") return `Rewrite the cited fragment to address “${title}”, using only facts already present in the CV.`;
    if (input.suggestionType === "expose") return `Move the existing CV evidence related to “${title}” closer to the summary or the relevant role.`;
    if (input.suggestionType === "gap") return `Check whether you have verifiable evidence related to “${title}”; add it only if it is true.`;
    if (input.suggestionType === "question") return usableQuestion ? `Answer this before changing the CV: ${usableQuestion}` : `Clarify the missing facts behind “${title}” before rewriting the CV.`;
    return `Clarify and correct the part of the CV related to “${title}” without adding unsupported facts.`;
  }

  if (input.suggestionType === "rewrite") return `Przepisz wskazany fragment tak, aby rozwiązywał problem „${title}”, zachowując wyłącznie fakty obecne w CV.`;
  if (input.suggestionType === "expose") return `Przenieś istniejący w CV dowód związany z problemem „${title}” bliżej podsumowania lub właściwej roli.`;
  if (input.suggestionType === "gap") return `Sprawdź, czy masz możliwy do potwierdzenia dowód związany z problemem „${title}”; dodaj go tylko wtedy, gdy jest prawdziwy.`;
  if (input.suggestionType === "question") return usableQuestion ? `Odpowiedz na to pytanie przed zmianą CV: ${usableQuestion}` : `Doprecyzuj brakujące fakty związane z problemem „${title}”, zanim przepiszesz CV.`;
  return `Doprecyzuj i popraw fragment CV związany z problemem „${title}”, nie dodając niepotwierdzonych faktów.`;
}
