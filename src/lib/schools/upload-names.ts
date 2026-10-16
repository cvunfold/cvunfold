export function studentNameFromFilename(filename: string): string {
  return filename.split(/[\\/]/).pop()!.replace(/\.(pdf|docx)$/i, "")
    .replace(/[_-]+/g, " ").replace(/\b(?:cv|resume|curriculum vitae|final|updated|wersja|poprawione|before|after|guided|concise)\b/gi, " ")
    .replace(/\b\d{4,}\b/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "CV bez nazwiska";
}
export function studentNameFromHeader(text: string): string | undefined {
  const excluded = /(?:developer|engineer|specialist|designer|analityk|specjalista|programista|frontend|backend|javascript|typescript|react|python|curriculum|resume|profil|summary|portfolio|projekty|projects|education|wykształcenie|skills|kontakt|contact|experience|doświadczenie|im[ięe].*nazwisko)/i;
  for (const raw of text.split(/\r?\n/).slice(0, 12)) {
    const line = raw.replace(/^\s*(?:imię i nazwisko|name)\s*:\s*/i, "").trim();
    if (excluded.test(line) || /[@:/\d]/.test(line) || line.length > 70) continue;
    if (/^[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+){1,3}$/u.test(line)) return line;
  }
}
