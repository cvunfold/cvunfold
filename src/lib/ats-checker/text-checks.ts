import { dateRangePattern, jobTitlePattern, matchedSectionKeys } from "@/lib/document-parsing/cv-detection";
import { PII_MASK_TOKENS } from "@/lib/document-parsing";
import type { AtsCheckItem } from "./types";

const coreSectionKeys = new Set(["experience", "skills", "education"]);

export function checkSections(text: string): AtsCheckItem {
  const matched = matchedSectionKeys(text);
  const coreMatched = matched.filter((key) => coreSectionKeys.has(key));
  const metrics = { sections_recognized: matched.length, core_sections_recognized: coreMatched.length };
  if (matched.includes("experience") && coreMatched.length >= 2) return { id: "sections", status: "pass", metrics };
  if (matched.includes("experience") || coreMatched.length >= 1) return { id: "sections", status: "warning", metrics };
  return { id: "sections", status: "fail", metrics };
}

export function checkDatesAndTitles(text: string): AtsCheckItem {
  const dateRanges = text.match(dateRangePattern)?.length || 0;
  const hasJobTitle = jobTitlePattern.test(text);
  const metrics = { date_ranges: dateRanges, job_titles_found: hasJobTitle ? 1 : 0 };
  if (dateRanges >= 1 && hasJobTitle) return { id: "dates_titles", status: "pass", metrics };
  if (dateRanges >= 1 || hasJobTitle) return { id: "dates_titles", status: "warning", metrics };
  return { id: "dates_titles", status: "fail", metrics };
}

/**
 * Runs against the already-PII-masked text: `maskContactPii` leaves a literal
 * token (`[EMAIL UKRYTY]`, `[TELEFON UKRYTY]`) wherever its own regex matched
 * contact info, so the presence of a token *is* the parsability signal — this
 * check never needs to see the raw email or phone number.
 */
export function checkContactInfo(maskedText: string): AtsCheckItem {
  const hasEmail = maskedText.includes(PII_MASK_TOKENS.email);
  const hasPhone = maskedText.includes(PII_MASK_TOKENS.phone);
  const metrics = { email_found: hasEmail ? 1 : 0, phone_found: hasPhone ? 1 : 0 };
  if (hasEmail) return { id: "contact_info", status: "pass", metrics };
  if (hasPhone) return { id: "contact_info", status: "warning", metrics };
  return { id: "contact_info", status: "fail", metrics };
}

// U+FFFD is what a parser emits for a byte/glyph it could not map to a character
// at all. The Private Use Area (U+E000-U+F8FF) is where icon fonts (Font
// Awesome, Material Icons, ...) commonly remap glyphs when embedded in a PDF —
// visually an icon, but extracted as an unprintable codepoint with no text meaning.
const replacementCharPattern = /[\u{FFFD}]/gu;
const privateUseAreaPattern = /[\u{E000}-\u{F8FF}]/gu;
const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

export function checkGlyphArtifacts(text: string): AtsCheckItem {
  const replacementChars = text.match(replacementCharPattern)?.length || 0;
  const privateUseChars = text.match(privateUseAreaPattern)?.length || 0;
  const controlChars = text.match(controlCharPattern)?.length || 0;
  const totalArtifacts = replacementChars + privateUseChars + controlChars;
  const ratio = text.length > 0 ? totalArtifacts / text.length : 0;
  const metrics = { replacement_chars: replacementChars, private_use_chars: privateUseChars, control_chars: controlChars };
  if (replacementChars > 0 || ratio > 0.02) return { id: "glyph_artifacts", status: "fail", metrics };
  if (privateUseChars > 0 || controlChars > 0) return { id: "glyph_artifacts", status: "warning", metrics };
  return { id: "glyph_artifacts", status: "pass", metrics };
}

// A numeric date where both parts could be a day or a month (e.g. 03/04/2021)
// is genuinely ambiguous outside its author's own locale convention — an ATS
// parser cannot recover whether it means 3 April or 4 March. Month-name and
// ISO dates carry no such ambiguity.
const ambiguousNumericDate = /\b(0?[1-9]|1[0-2])[/.](0?[1-9]|1[0-2])[/.](?:19|20)\d{2}\b/g;
// Not global: only ever used with .test(), and .test() keeps lastIndex state
// on a /g regex between calls — a shared module-level instance would then give
// different answers on the second call for the same input.
const isoDate = /\b(?:19|20)\d{2}-\d{2}(?:-\d{2})?\b/;
const monthNameDate = /\b(?:styczeń|stycznia|luty|lutego|marzec|marca|kwiecień|kwietnia|maj|maja|czerwiec|czerwca|lipiec|lipca|sierpień|sierpnia|wrzesień|września|październik|października|listopad|listopada|grudzień|grudnia|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+(?:19|20)\d{2}\b/i;
const numericMonthYear = /\b(0?[1-9]|1[0-2])\/(?:19|20)\d{2}\b/;

export function checkDateFormat(text: string): AtsCheckItem {
  const ambiguousMatches = text.match(ambiguousNumericDate)?.length || 0;
  const formatsUsed = [isoDate, monthNameDate, numericMonthYear].filter((pattern) => pattern.test(text)).length
    + (ambiguousMatches > 0 ? 1 : 0);
  const metrics = { ambiguous_numeric_dates: ambiguousMatches, distinct_date_formats: formatsUsed };
  if (ambiguousMatches > 0) return { id: "date_format", status: "fail", metrics };
  if (formatsUsed >= 3) return { id: "date_format", status: "warning", metrics };
  return { id: "date_format", status: "pass", metrics };
}
