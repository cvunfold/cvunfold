export const PROPOSED_WORDING_POLICY_VERSION = "cv-wording-v1";

const imperative = /(?<!\p{L})(?:dodaj|dodawaj|uzupełnij|dopisz|opisz|podaj|wskaż|wyjaśnij|ustal|sprawdź|uporządkuj|przenieś|wyeksponuj|zastąp|usuń|skróć|popraw|potwierdź|wstaw|zamieść|zadbaj|add|include|insert|describe|explain|clarify|check|verify|organize|organise|replace|remove|rewrite|highlight|move|ensure|provide)(?!\p{L})/iu;
const directImperative = /^(?:proszę\s+|please\s+)?(?:dodaj|dodawaj|uzupełnij|dopisz|opisz|podaj|wskaż|wyjaśnij|ustal|sprawdź|uporządkuj|przenieś|wyeksponuj|zastąp|usuń|skróć|popraw|potwierdź|wstaw|zamieść|zadbaj|add|include|insert|describe|explain|clarify|check|verify|organize|organise|replace|remove|rewrite|highlight|move|ensure|provide)(?!\p{L})/iu;

/** Conservative presentation guard, not a scoring or model-input rule. */
export function isWordingInstruction(value: string): boolean {
  const text = value.trim().replace(/^["„“'«]+|["”"'»]+$/gu, "");
  // Quoted button labels such as "Add to cart" are legitimate CV facts.
  const withoutLabels = text.replace(/"[^"]*"|„[^”]*”|“[^”]*”|«[^»]*»/gu, "");
  return withoutLabels.split(/(?:[.!?]\s+|\n)/u).some(sentence => {
    const part = sentence.trim().replace(/^(?:[-*•]\s*|\d+[.)]\s*)/u, "");
    return directImperative.test(part)
      || (/^(?:po|jeśli|gdy|kiedy|najpierw|następnie|after|once|if|when|first|next|then)\b/iu.test(part) && imperative.test(part))
      || /^(?:należy|warto|możesz|powinieneś|powinnaś|you should|you need to|you can|please consider)(?!\p{L})/iu.test(part);
  });
}
