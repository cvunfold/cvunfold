const signatures = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
};

const allowedMime = {
  pdf: new Set(["application/pdf", "application/octet-stream", ""]),
  docx: new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream", ""]),
};

export function validateUpload(file: File, maxMb = Number(process.env.MAX_FILE_SIZE_MB || 8)): void {
  if (file.size === 0) throw new Error("EMPTY_FILE");
  if (file.size > maxMb * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) throw new Error("UNSUPPORTED_FILE_TYPE");
  const kind = name.endsWith(".pdf") ? "pdf" : "docx";
  if (!allowedMime[kind].has(file.type.toLowerCase())) throw new Error("INVALID_FILE_MIME");
}

export async function validateSignature(file: File): Promise<void> {
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const expected = isPdf ? signatures.pdf : signatures.zip;
  if (!expected.every((byte, index) => bytes[index] === byte)) throw new Error("INVALID_FILE_SIGNATURE");
  if (!isPdf) validateDocxArchive(Buffer.from(await file.arrayBuffer()));
}

export function validateDocxArchive(buffer: Buffer, maxUncompressedBytes = 25 * 1024 * 1024, maxEntries = 500): void {
  const eocdSignature = 0x06054b50;
  const centralSignature = 0x02014b50;
  const start = Math.max(0, buffer.length - 65_557);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error("INVALID_FILE_SIGNATURE");
  const entries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (entries < 2 || entries > maxEntries || centralOffset + centralSize > buffer.length) throw new Error("DOCX_ARCHIVE_UNSAFE");
  let offset = centralOffset;
  let totalCompressed = 0;
  let totalUncompressed = 0;
  const names = new Set<string>();
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== centralSignature) throw new Error("DOCX_ARCHIVE_UNSAFE");
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if ((flags & 1) !== 0 || (method !== 0 && method !== 8)) throw new Error("DOCX_ARCHIVE_UNSAFE");
    if (compressed === 0 && uncompressed > 0) throw new Error("DOCX_ARCHIVE_UNSAFE");
    if (compressed > 0 && uncompressed / compressed > 200) throw new Error("DOCX_ARCHIVE_UNSAFE");
    const nameStart = offset + 46;
    const nextOffset = nameStart + nameLength + extraLength + commentLength;
    if (nextOffset > buffer.length) throw new Error("DOCX_ARCHIVE_UNSAFE");
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    if (name.startsWith("/") || name.split("/").includes("..")) throw new Error("DOCX_ARCHIVE_UNSAFE");
    names.add(name);
    totalCompressed += compressed;
    totalUncompressed += uncompressed;
    if (totalUncompressed > maxUncompressedBytes || (totalCompressed > 0 && totalUncompressed / totalCompressed > 120)) throw new Error("DOCX_ARCHIVE_UNSAFE");
    offset = nextOffset;
  }
  if (!names.has("[Content_Types].xml") || !names.has("word/document.xml")) throw new Error("INVALID_FILE_SIGNATURE");
}
