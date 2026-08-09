import mammoth from "mammoth";

export type Segment = { id: string; text: string };
export type ParsedDocument = { text: string; segments: Segment[]; quality: "good" | "degraded" };

const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phone = /(?<!\d)(?:\+?48[ -]?)?(?:\d[ -]?){9}(?!\d)/g;
const address = /\b(?:ul\.|aleja|al\.|os\.)\s+[^\n,]{3,40}(?:,\s*\d{2}-\d{3}\s+[^\n]+)?/gi;
const protectedTraitLabel = /(?<![\p{L}])(?:age|date of birth|gender|sex|nationality|citizenship|marital[ -]status|family[ -]status|wiek|data urodzenia|płeć|narodowość|obywatelstwo|stan cywilny)(?![\p{L}])/giu;

export function maskContactPii(text: string): string {
  return text.replace(email, "[EMAIL UKRYTY]").replace(phone, "[TELEFON UKRYTY]").replace(address, "[ADRES UKRYTY]");
}

function containsProtectedPersonalData(text: string): boolean {
  const matches = text.match(protectedTraitLabel) || [];
  if (new Set(matches.map((value) => value.toLocaleLowerCase("en"))).size >= 2) return true;
  return /(?<![\p{L}])(?:age|date of birth|gender|sex|nationality|citizenship|marital[ -]status|family[ -]status|wiek|data urodzenia|płeć|narodowość|obywatelstwo|stan cywilny)(?![\p{L}])\s*(?::|[-–—]|\d)/iu.test(text);
}

function looksLikePromptInjection(text: string): boolean {
  return /(?:ignore previous instructions|give (?:a )?score(?: of)? \d+|reveal (?:the )?(?:system prompt|secrets)|environment variables|open https?:\/\/|zignoruj poprzednie instrukcje|przyznaj \d+ punktów|ujawnij (?:prompt systemowy|sekrety)|zmienne środowiskowe|otwórz https?:\/\/)/i.test(text);
}

export function createSegments(text: string): Segment[] {
  return text.split(/\n{2,}|(?<=\.)\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/).map((part) => part.trim()).filter((part) => Boolean(part) && !containsProtectedPersonalData(part) && !looksLikePromptInjection(part))
    .slice(0, 200).map((part, index) => ({ id: `seg_${index.toString(36)}`, text: part }));
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = "";
  if (name.endsWith(".docx")) text = (await mammoth.extractRawText({ buffer })).value;
  else if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    text = (await pdfParse(buffer, { max: Number(process.env.MAX_PDF_PAGES || 40) })).text;
  } else throw new Error("UNSUPPORTED_FILE_TYPE");
  text = maskContactPii(text).replace(/\0/g, "").trim();
  if (text.length < 120) throw new Error("UNREADABLE_DOCUMENT");
  return { text, segments: createSegments(text), quality: text.length < 500 ? "degraded" : "good" };
}
