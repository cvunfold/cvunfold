export type CVDetectionResult = {
  isLikelyCv: boolean;
  confidence: "low" | "medium" | "high";
  score: number;
  signals: string[];
};

export const sectionSignals = [
  { key: "experience", weight: 3, pattern: /\b(do(?:ś|s)wiadczenie(?: zawodowe)?|historia zatrudnienia|przebieg kariery|experience|employment|work history|professional experience)\b/i },
  { key: "education", weight: 1, pattern: /\b(wykszta(?:ł|l)cenie|edukacja|studia|uczelnia|education|university|college|degree)\b/i },
  { key: "skills", weight: 2, pattern: /\b(umiej(?:ę|e)tno(?:ś|s)ci|kompetencje|technologie|stack technologiczny|skills|competencies|technologies|tech stack)\b/i },
  { key: "profile", weight: 1, pattern: /\b(profil zawodowy|podsumowanie zawodowe|o mnie|professional profile|professional summary|career summary|about me)\b/i },
  { key: "projects", weight: 1, pattern: /\b(projekty|osi(?:ą|a)gni(?:ę|e)cia|certyfikaty|publikacje|projects|achievements|certifications|publications)\b/i },
  { key: "languages", weight: 1, pattern: /\b(j(?:ę|e)zyki|znajomo(?:ś|s)ć j(?:ę|e)zyków|languages|language skills)\b/i },
] as const;

export const yearPattern = /\b(?:19|20)\d{2}\b/g;
export const dateRangePattern = /\b(?:19|20)\d{2}\s*(?:[-–—]|do|to)\s*(?:(?:19|20)\d{2}|obecnie|present|current)\b/gi;
export const jobTitlePattern = /\b(developer(?:ka)?|engineer|in(?:ż|z)ynier(?:ka)?|manager(?:ka)?|kierownik|specjalist(?:a|ka)|analityk|analityczka|consultant|konsultant(?:ka)?|designer|projektant(?:ka)?|administrator|architect|architekt(?:ka)?|director|dyrektor(?:ka)?|lead|intern|sta(?:ż|z)yst(?:a|ka))\b/i;
const bulletLinePattern = /^\s*(?:[-•●▪◦]|\d+[.)])\s+\S+/gm;
const minimumStructuredCvChars = 180;

/** Section keys the text visibly signals, in `sectionSignals` order. Shared with the ATS checker so "which sections did we recognize" has one source of truth. */
export function matchedSectionKeys(text: string): string[] {
  return sectionSignals.filter(({ pattern }) => pattern.test(text)).map(({ key }) => key);
}

export function detectLikelyCv(text: string): CVDetectionResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length < minimumStructuredCvChars) return { isLikelyCv: false, confidence: "low", score: 0, signals: ["too_short"] };

  let score = 0;
  const signals: string[] = [];
  const matchedSections = sectionSignals.filter(({ key, weight, pattern }) => {
    if (!pattern.test(normalized)) return false;
    score += weight;
    signals.push(key);
    return true;
  });

  const years = normalized.match(yearPattern)?.length || 0;
  const dateRanges = normalized.match(dateRangePattern)?.length || 0;
  if (dateRanges >= 1 || years >= 2) {
    score += 2;
    signals.push("career_dates");
  }

  const hasJobTitle = jobTitlePattern.test(normalized);
  if (hasJobTitle) {
    score += 2;
    signals.push("job_titles");
  }

  const bulletLines = text.match(bulletLinePattern)?.length || 0;
  if (bulletLines >= 2) {
    score += 1;
    signals.push("bullet_history");
  }

  const hasCareerAnchor = signals.includes("experience") || (hasJobTitle && (dateRanges >= 1 || years >= 2));
  const hasEnoughStructure = matchedSections.length >= 2 || (hasJobTitle && bulletLines >= 2);
  const isLikelyCv = score >= 6 && hasCareerAnchor && hasEnoughStructure;
  const confidence = !isLikelyCv ? "low" : score >= 9 ? "high" : "medium";

  return { isLikelyCv, confidence, score, signals };
}

export function validateCvText(text: string, maxLength = Number(process.env.MAX_CV_TEXT_LENGTH || 30_000)): CVDetectionResult {
  if (text.length > maxLength) throw new Error("DOCUMENT_TEXT_TOO_LONG");
  const result = detectLikelyCv(text);
  if (!result.isLikelyCv) throw new Error("NOT_A_CV");
  return result;
}
