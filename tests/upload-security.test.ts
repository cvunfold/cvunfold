import { describe, expect, it } from "vitest";
import { validateSignature, validateUpload } from "@/lib/security/upload";

function minimalDocx(): Buffer {
  const entries = [
    { name: "[Content_Types].xml", data: Buffer.from("<Types/>") },
    { name: "word/document.xml", data: Buffer.from("<w:document/>") },
  ];
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, entry.data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + entry.data.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDirectory, end]);
}

describe("upload launch boundary", () => {
  it("accepts a PDF with a matching signature", async () => {
    const file = new File([Buffer.from("%PDF-1.7\nsynthetic")], "cv.pdf", { type: "application/pdf" });
    expect(() => validateUpload(file)).not.toThrow();
    await expect(validateSignature(file)).resolves.toBeUndefined();
  });

  it("accepts a structurally safe DOCX archive", async () => {
    const docx = minimalDocx();
    const bytes = new Uint8Array(docx.byteLength);
    bytes.set(docx);
    const file = new File([bytes], "cv.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    expect(() => validateUpload(file)).not.toThrow();
    await expect(validateSignature(file)).resolves.toBeUndefined();
  });

  it("rejects an empty, oversized, mismatched or forged file", async () => {
    expect(() => validateUpload(new File([], "cv.pdf", { type: "application/pdf" }))).toThrow("EMPTY_FILE");
    expect(() => validateUpload(new File([Buffer.alloc(2 * 1024 * 1024)], "cv.pdf", { type: "application/pdf" }), 1)).toThrow("FILE_TOO_LARGE");
    expect(() => validateUpload(new File(["x"], "cv.pdf", { type: "text/plain" }))).toThrow("INVALID_FILE_MIME");
    const forged = new File(["not-pdf"], "cv.pdf", { type: "application/pdf" });
    await expect(validateSignature(forged)).rejects.toThrow("INVALID_FILE_SIGNATURE");
  });
});
