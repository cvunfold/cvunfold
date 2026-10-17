import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { expandSchoolFiles, studentNameFromFilename, studentNameFromHeader } from "@/lib/schools/upload-files";
import { estimateSchoolReady } from "@/lib/schools/upload-model";
const zip = (entries: Record<string, Uint8Array>) => new File([zipSync(entries) as BlobPart], "grupa.zip");
describe("school batch inputs", () => {
  it("accepts 30 CVs and unpacks nested folders while ignoring OS metadata", async () => {
    const entries = Object.fromEntries(Array.from({ length: 30 }, (_,i) => [`grupa/Anna_${i}.pdf`, strToU8("%PDF test")]));
    entries["__MACOSX/._Anna.pdf"] = strToU8("metadata"); entries["readme.txt"] = strToU8("note");
    const result = await expandSchoolFiles([zip(entries)]);
    expect(result).toHaveLength(30); expect(result[0].name).toBe("Anna_0.pdf");
  });
  it("rejects too many files, traversal, truncated archives and compressed oversized CVs", async () => {
    await expect(expandSchoolFiles([zip(Object.fromEntries(Array.from({ length: 31 },(_,i) => [`${i}.pdf`, strToU8("pdf")])))] )).rejects.toThrow();
    await expect(expandSchoolFiles([zip({ "../Anna.pdf": strToU8("pdf") })])).rejects.toThrow();
    const valid = zip({ "Anna.pdf": strToU8("pdf") });
    await expect(expandSchoolFiles([new File([(await valid.arrayBuffer()).slice(0,-10)], "broken.zip")])).rejects.toThrow();
    await expect(expandSchoolFiles([zip({ "big.pdf": new Uint8Array(8*1024*1024+1) })])).rejects.toThrow();
    await expect(expandSchoolFiles([zip({ "empty.pdf": new Uint8Array() })])).rejects.toThrow();
  });
  it("extracts literal names but skips roles and section titles", () => {
    expect(studentNameFromFilename("folder/CV_Anna_Kowalska_after_2026.pdf")).toBe("Anna Kowalska");
    expect(studentNameFromHeader("Frontend Developer\nAnna Mączka-Czarnecka\nProjekty\nReact TypeScript")).toBe("Anna Mączka-Czarnecka");
    expect(studentNameFromHeader("Frontend Developer\nReact TypeScript\nPortfolio\nKontakt")).toBeUndefined();
  });
  it("uses observed mean, accounts for a running job and rate-limit waiting", () => {
    const now = Date.now(), timing = { averageMs: 120000, sampleCount: 20 };
    const job = { id:"a", name:"Anna", status:"queued" as const };
    expect(estimateSchoolReady([job, { ...job, id:"b", status:"processing", startedAt:new Date(now-60000).toISOString() }], timing, now).remainingMs).toBe(210000);
    expect(estimateSchoolReady([{ ...job, notBefore:new Date(now+3600000).toISOString() }], timing, now).remainingMs).toBe(3750000);
    expect(estimateSchoolReady([{ ...job, status:"complete" }],timing,now).remainingMs).toBe(0);
  });
});
