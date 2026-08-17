#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const args = process.argv.slice(2);
const languageIndex = args.indexOf("--lang");
const language = languageIndex >= 0 ? args[languageIndex + 1] : "pl";
const json = args.includes("--json");
const positionalArgs = args.filter((arg, index) => {
  if (arg.startsWith("--")) return false;
  if (languageIndex >= 0 && index === languageIndex + 1) return false;
  return true;
});
const file = positionalArgs[0];

if (!file || !["pl", "en"].includes(language)) {
  console.error("Usage: node audit-article.mjs <draft.md> --lang pl|en [--json]");
  process.exit(2);
}

const source = await readFile(file, "utf8");
const withoutCode = source.replace(/```[\s\S]*?```/g, " ");
const plain = withoutCode
  .replace(/^---[\s\S]*?^---$/m, " ")
  .replace(/^#{1,6}\s+/gm, "")
  .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[*_>`~-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const words = plain.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) ?? [];
const sentences = plain.split(/(?<=[.!?])\s+/u).filter(Boolean);
const markdownBlocks = withoutCode.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);
const paragraphs = markdownBlocks.filter((block) => !/^#{1,6}\s/u.test(block) && !/^[-*+]\s/u.test(block));
const headings = [...withoutCode.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());

const countWords = (value) => value.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu)?.length ?? 0;
const paragraphWordCounts = paragraphs.map(countWords);
const sentenceWordCounts = sentences.map(countWords);
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const deviation = (values) => {
  if (!values.length) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
};
const coefficientOfVariation = (values) => {
  const mean = average(values);
  return mean ? deviation(values) / mean : 0;
};

const sectionParagraphCounts = [];
let currentSection = -1;
for (const block of markdownBlocks) {
  if (/^##\s/u.test(block)) {
    currentSection += 1;
    sectionParagraphCounts[currentSection] = 0;
  } else if (currentSection >= 0 && !/^#{1,6}\s/u.test(block) && !/^[-*+]\s/u.test(block)) {
    sectionParagraphCounts[currentSection] += 1;
  }
}

const phrasePatterns = language === "pl"
  ? [
      ["nie chodzi o", /\bnie chodzi o\b/giu],
      ["nie tylko ... ale także", /\bnie tylko\b[^.!?]{0,100}\bale (?:także|również)\b/giu],
      ["warto zauważyć/pamiętać", /\bwarto (?:zauważyć|pamiętać|podkreślić)(?=\s|[.,!?;:]|$)/giu],
      ["kluczowe jest", /\bkluczowe jest\b/giu],
      ["w dzisiejszych czasach", /\bw dzisiejszych czasach\b/giu],
      ["podsumowując", /\bpodsumowując\b/giu],
    ]
  : [
      ["it is important to", /\bit is important to\b/giu],
      ["not only ... but also", /\bnot only\b[^.!?]{0,100}\bbut also\b/giu],
      ["it is worth noting", /\bit is worth noting\b/giu],
      ["in today's", /\bin today['’]s\b/giu],
      ["in conclusion", /\bin conclusion\b/giu],
    ];

const phraseCounts = Object.fromEntries(phrasePatterns.map(([label, pattern]) => [label, [...plain.matchAll(pattern)].length]));
const abstractPatterns = language === "pl"
  ? ["kontekst", "decyzj", "rezultat", "wpływ", "odpowiedzial", "sygnał", "problem"]
  : ["context", "decision", "outcome", "impact", "responsib", "signal", "problem"];
const normalized = plain.toLocaleLowerCase(language);
const abstractCounts = Object.fromEntries(abstractPatterns.map((stem) => [stem, (normalized.match(new RegExp(stem, "gu")) ?? []).length]));

const warnings = [];
if (words.length < 350) warnings.push("Short draft: confirm that a standalone article adds more value than an existing-page update.");
if (paragraphWordCounts.some((count) => count > 130)) warnings.push("At least one paragraph exceeds 130 words; check whether it carries more than one idea.");
if (paragraphWordCounts.length >= 6 && coefficientOfVariation(paragraphWordCounts) < 0.22) warnings.push("Paragraph lengths are unusually uniform; check for template-driven rhythm.");
if (sentenceWordCounts.length >= 12 && coefficientOfVariation(sentenceWordCounts) < 0.28) warnings.push("Sentence lengths are unusually uniform; read the draft aloud for mechanical rhythm.");
if (sectionParagraphCounts.length >= 4 && new Set(sectionParagraphCounts).size === 1) warnings.push("Every section has the same paragraph count; confirm that the structure follows the argument.");
if (Object.values(phraseCounts).reduce((sum, value) => sum + value, 0) >= 3) warnings.push("Several stock transition patterns appear; remove any that do not add meaning.");
if (Math.max(0, ...Object.values(abstractCounts)) > Math.max(4, words.length / 140)) warnings.push("One abstract brand term repeats frequently; replace repetitions with concrete actions, objects, or examples.");

const wordsPerMinute = language === "pl" ? 180 : 220;
const result = {
  file,
  language,
  words: words.length,
  estimatedReadingMinutes: Math.max(1, Math.ceil(words.length / wordsPerMinute)),
  headings: headings.length,
  paragraphs: paragraphs.length,
  sentences: sentences.length,
  averageWordsPerSentence: Number(average(sentenceWordCounts).toFixed(1)),
  paragraphLengthVariation: Number(coefficientOfVariation(paragraphWordCounts).toFixed(2)),
  sentenceLengthVariation: Number(coefficientOfVariation(sentenceWordCounts).toFixed(2)),
  sectionParagraphCounts,
  phraseCounts,
  abstractCounts,
  warnings,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Words: ${result.words}`);
  console.log(`Estimated reading time: ${result.estimatedReadingMinutes} min`);
  console.log(`Sections / paragraphs / sentences: ${result.headings} / ${result.paragraphs} / ${result.sentences}`);
  console.log(`Average sentence length: ${result.averageWordsPerSentence} words`);
  console.log(`Section paragraph counts: ${result.sectionParagraphCounts.join(", ") || "none"}`);
  console.log(`Stock phrases: ${JSON.stringify(result.phraseCounts)}`);
  console.log(`Abstract terms: ${JSON.stringify(result.abstractCounts)}`);
  if (warnings.length) {
    console.log("Warnings:");
    for (const warning of warnings) console.log(`- ${warning}`);
  } else {
    console.log("Warnings: none");
  }
}
