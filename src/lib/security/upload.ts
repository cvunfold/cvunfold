const signatures = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
};

export function validateUpload(file: File, maxMb = Number(process.env.MAX_FILE_SIZE_MB || 8)): void {
  if (file.size === 0) throw new Error("EMPTY_FILE");
  if (file.size > maxMb * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) throw new Error("UNSUPPORTED_FILE_TYPE");
}

export async function validateSignature(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const expected = file.name.toLowerCase().endsWith(".pdf") ? signatures.pdf : signatures.zip;
  if (!expected.every((byte, index) => bytes[index] === byte)) throw new Error("INVALID_FILE_SIGNATURE");
}
