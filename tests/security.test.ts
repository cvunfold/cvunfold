import { describe, expect, it } from "vitest";
import { maskContactPii } from "@/lib/document-parsing";
import { createAccessToken, hashToken } from "@/lib/security/tokens";
import { validateUpload } from "@/lib/security/upload";
import { safeAnalyticsPath } from "@/lib/analytics/client";
import { safeAnalyticsPayload } from "@/lib/analytics/events";
describe("privacy controls",()=>{
  it("masks contact PII",()=>expect(maskContactPii("jan@example.com +48 500 600 700")).toBe("[EMAIL UKRYTY] [TELEFON UKRYTY]"));
  it("creates non-sequential random tokens and hashes them",()=>{const a=createAccessToken(),b=createAccessToken();expect(a).not.toBe(b);expect(a.length).toBeGreaterThan(30);expect(hashToken(a)).not.toContain(a)});
  it("rejects non CV files",()=>expect(()=>validateUpload(new File(["x"],"malware.exe"))).toThrow("UNSUPPORTED_FILE_TYPE"));
  it("scrubs forbidden analytics properties without mutating the source",()=>{const source={cv_text:"secret",source:"google"};expect(safeAnalyticsPayload("analysis_succeeded",source).properties).toEqual({source:"google"});expect(source.cv_text).toBe("secret")});
  it("never exposes a private report access token as an analytics path",()=>expect(safeAnalyticsPath("/pl/raport/super-secret-access-token")).toBe("/pl/raport/:token"));
});
