import type { Locale } from "@/lib/i18n";
export const LANGUAGE_POLICY_VERSION = "language-v2.0.1";
export const LANGUAGE_POLICIES: Record<Locale, string> = {
  pl: `# Report language: pl
Write all explanations and actions in natural Polish. Keep original CV quotes unchanged; a proposed CV rewrite stays in the CV's language. Use direct, neutral instructions such as Doprecyzuj, Ustal, Dodaj, CV pokazuje. Do not infer grammatical gender from names or photos. Standard technical terms may remain English, but avoid English sentence structure and literal translation. Do not use the em dash character. Do not expose internal contract names, JSON fields, prompt versions or pipeline mechanics in report prose. Segment IDs such as seg_1 belong only in evidenceRefs fields, never in narrative sentences or parenthetical citations.`,
  en: `# Report language: en
Write all explanations and actions in idiomatic English. Keep original CV quotes unchanged; a proposed CV rewrite stays in the CV's language. Use direct instructions and neutral references to the candidate. Do not infer gender or pronouns from names or photos. Do not use the em dash character. Do not expose internal contract names, JSON fields, prompt versions or pipeline mechanics in report prose. Segment IDs such as seg_1 belong only in evidenceRefs fields, never in narrative sentences or parenthetical citations.`,
};
