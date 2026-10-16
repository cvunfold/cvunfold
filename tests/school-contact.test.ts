import { describe, expect, it } from "vitest";
import { extractSchoolContact, readSchoolContact } from "@/lib/schools/contact";

describe("school CV contact extraction", () => {
  it("extracts literal email and normalizes international and local phone links", () => {
    expect(extractSchoolContact("Anna Testowa\nE-mail: anna+cv@example.com\nTel.: +48 501 234 567\nTelefon: 600700800\nWykształcenie\n2019-2023")).toEqual({ emails: ["anna+cv@example.com"], phones: [{ label: "+48 501 234 567", number: "+48501234567" }, { label: "600700800", number: "600700800" }] });
    expect(extractSchoolContact("Contact: 0044 7700 900123").phones[0]?.number).toBe("+447700900123");
  });
  it("does not guess absent contacts or interpret dates, IDs, URL digits or references as contact", () => {
    expect(extractSchoolContact("Anna Testowa\n2019-2023\n12345678901\nhttps://example.com/501234567\nProjekty\nKlient: client@example.com\nReferencje\nref@example.com")).toEqual({ emails: [], phones: [] });
  });
  it("does not interpret education and project date ranges as phones in varied headings", () => {
    const cv = "Ewa Testowa\nProjekt zespołowy\n06.2026 - 08.2026\nProjekty i nauka\n03/2023 - 06/2023\n2024-04-02\n12-10-2024\nKontakt: ewa@example.test | +48 501 234 567";
    expect(extractSchoolContact(cv)).toEqual({ emails: ["ewa@example.test"], phones: [{ label: "+48 501 234 567", number: "+48501234567" }] });
    expect(extractSchoolContact("Kontakt: 01.2021 - 12.2025").phones).toEqual([]);
  });
  it("deduplicates contacts and rejects unsafe stored values", () => {
    expect(extractSchoolContact("anna@example.com anna@example.com\n+48 501 234 567\n+48501234567").emails).toEqual(["anna@example.com"]);
    expect(readSchoolContact({ emails: ["anna@example.com?bcc=evil@example.com"], phones: [] })).toBeUndefined();
    expect(readSchoolContact({ emails: [], phones: [{ label: "test", number: "+48123;ext=999" }] })).toBeUndefined();
    expect(readSchoolContact(null)).toBeUndefined();
  });
});
