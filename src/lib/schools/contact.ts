import { z } from "zod";
import type { CVReport } from "@/lib/ai/schemas/report";

const contactSchema = z.object({
  emails: z.array(z.string().email().max(254)).max(5),
  phones: z.array(z.object({ label: z.string().max(40), number: z.string().regex(/^\+?\d{9,15}$/) })).max(5),
});
export type SchoolContact = z.infer<typeof contactSchema>;
// Server-owned metadata, appended after model validation. Never part of the AI schema.
export type SchoolStoredReport = CVReport & { schoolContact?: SchoolContact };
export function readSchoolContact(value: unknown): SchoolContact | undefined {
  const parsed = contactSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/** Extract only literal contact details from the CV header/contact lines. No model or guesses. */
export function extractSchoolContact(text: string): SchoolContact {
  const lines = text.replace(/\u00a0/g, " ").split(/\r?\n/);
  const contactLines: string[] = [];
  let inHeader = true;
  let inReferences = false;
  let headerChars = 0;
  for (const line of lines) {
    if (/^\s*(?:referencje|references)\b/i.test(line)) inReferences = true;
    if (inReferences) continue;
    if (/^\s*(?:doświadczenie(?: zawodowe)?|wykształcenie|edukacja|projekty|umiejętności|referencje|experience|work experience|education|projects|skills|references)\s*[:|]?\s*$/i.test(line)) inHeader = false;
    headerChars += line.length;
    if ((inHeader && headerChars <= 2000) || /^\s*(?:e-?mail|telefon|tel\.?|phone|mobile|kontakt|contact)\s*:/i.test(line)) contactLines.push(line);
  }
  const emails = new Set<string>();
  const phones = new Map<string, string>();
  for (const line of contactLines) {
    for (const match of line.matchAll(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi)) {
      const email = match[0];
      if (z.string().email().max(254).safeParse(email).success) emails.add(email);
    }
    // CV dates can otherwise combine into a 9-15 digit phone candidate.
    // Remove each date before matching so a nearby actual phone is retained.
    const phoneLine = line.replace(/\S*@\S+|(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/\b(?:\d{1,2}[./-](?:\d{1,2}[./-])?(?:19|20)\d{2}|(?:19|20)\d{2}[./-]\d{1,2}(?:[./-]\d{1,2})?)\b/g, " ");
    for (const match of phoneLine.matchAll(/(?<![\w+])(?:\+|00)?\d[\d ().-]{7,30}\d(?!\w)/g)) {
      const label = match[0].trim();
      if (/\b(?:19|20)\d{2}\s*[-.]\s*(?:19|20)\d{2}\b/.test(label)) continue;
      let number = label.replace(/[^\d+]/g, "");
      if (number.startsWith("00")) number = `+${number.slice(2)}`;
      if (!/^\+?\d{9,15}$/.test(number)) continue;
      // Bare digit strings need a phone label; international/grouped numbers are recognizable.
      if (!number.startsWith("+") && !/\s|[().-]/.test(label) && !/\b(?:telefon|tel\.?|phone|mobile)\b/i.test(line)) continue;
      phones.set(number, label);
    }
  }
  return { emails: [...emails].slice(0, 5), phones: [...phones].slice(0, 5).map(([number, label]) => ({ number, label })) };
}
