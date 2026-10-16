export { studentNameFromFilename, studentNameFromHeader } from "./upload-names";
import { validateUpload } from "@/lib/security/upload";

export const SCHOOL_BATCH_LIMIT = 30;
export const SCHOOL_BATCH_BYTES = 100 * 1024 * 1024;
export const SCHOOL_UPLOAD_BUCKET = "school-upload-queue";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function safeArchivePath(name: string): boolean {
  return !name.startsWith("/") && !name.startsWith("\\") && !/^[A-Z]:/i.test(name) && !name.replace(/\\/g, "/").split("/").includes("..") && !name.includes("\0");
}
function validateZipIndex(input: Uint8Array) {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  let end = -1;
  for (let offset = input.length - 22; offset >= Math.max(0, input.length - 65_557); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === input.length) { end = offset; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error("ZIP jest uszkodzony lub ma nieobsługiwany format.");
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
  if (count > 300 || start + size !== end) throw new Error("ZIP ma zbyt wiele plików lub nieobsługiwany format.");
  let cursor = start;
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50 || (view.getUint16(cursor + 8, true) & 1)) throw new Error("ZIP jest uszkodzony lub zaszyfrowany.");
    const nameSize = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true);
    const name = new TextDecoder().decode(input.subarray(cursor + 46, cursor + 46 + nameSize));
    if (!safeArchivePath(name)) throw new Error("ZIP zawiera nieprawidłową ścieżkę pliku.");
    cursor += 46 + nameSize + extra + comment;
  }
  if (cursor !== end) throw new Error("ZIP jest uszkodzony.");
}
async function unpack(zip: File): Promise<File[]> {
  const { Unzip, UnzipInflate } = await import("fflate");
  if (zip.size > SCHOOL_BATCH_BYTES) throw new Error("ZIP jest za duży. Maksymalnie 100 MB.");
  const input = new Uint8Array(await zip.arrayBuffer());
  validateZipIndex(input);
  return new Promise((resolve, reject) => {
    const files: File[] = []; let entries = 0, declared = 0, actual = 0, pending = 0, ended = false, stopped = false;
    const finish = () => { if (ended && !pending && !stopped) resolve(files); };
    const fail = () => { if (!stopped) { stopped = true; reject(new Error("Nie można rozpakować ZIP-a. Użyj niezaszyfrowanej paczki z PDF-ami lub DOCX, do 30 CV i 100 MB po rozpakowaniu.")); } };
    const reader = new Unzip(entry => {
      entries++;
      if (stopped || entries > 300 || !safeArchivePath(entry.name)) { fail(); return; }
      if (entry.name.endsWith("/") || /(?:^|\/)__MACOSX\/|(?:^|\/)\./.test(entry.name)) return;
      if (!/\.(pdf|docx)$/i.test(entry.name)) return;
      if (files.length + pending >= SCHOOL_BATCH_LIMIT || (entry.originalSize ?? 0) > MAX_FILE_BYTES) { fail(); return; }
      declared += entry.originalSize ?? 0;
      if (declared > SCHOOL_BATCH_BYTES) { fail(); return; }
      pending++; let size = 0; const chunks: Uint8Array[] = [];
      entry.ondata = (error, chunk, final) => {
        if (error || stopped) { entry.terminate(); fail(); return; }
        size += chunk.length; actual += chunk.length;
        if (size > MAX_FILE_BYTES || actual > SCHOOL_BATCH_BYTES) { entry.terminate(); fail(); return; }
        chunks.push(chunk.slice());
        if (final) {
          const name = entry.name.split("/").pop()!;
          const file = new File(chunks as BlobPart[], name, { type: /\.pdf$/i.test(name) ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
          try { validateUpload(file); } catch { fail(); return; }
          files.push(file); pending--; finish();
        }
      };
      entry.start();
    });
    reader.register(UnzipInflate);
    try {
      for (let offset = 0; offset < input.length && !stopped; offset += 16_384) reader.push(input.subarray(offset, offset + 16_384), offset + 16_384 >= input.length);
      ended = true; if (pending) fail(); else finish();
    } catch { fail(); }
  });
}
export async function expandSchoolFiles(selected: File[]): Promise<File[]> {
  const files: File[] = [];
  for (const file of selected) {
    const expanded = /\.zip$/i.test(file.name) ? await unpack(file) : [file];
    files.push(...expanded);
    if (files.length > SCHOOL_BATCH_LIMIT) throw new Error("Wybierz maksymalnie 30 CV w jednej paczce.");
  }
  let bytes = 0;
  for (const file of files) { validateUpload(file, 8); bytes += file.size; }
  if (!files.length) throw new Error("Nie znaleziono CV w formacie PDF lub DOCX.");
  if (bytes > SCHOOL_BATCH_BYTES) throw new Error("Paczka przekracza 100 MB po rozpakowaniu.");
  return files;
}
