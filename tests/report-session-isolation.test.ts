import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { clearReportSessionCookie, REPORT_SESSION_COOKIE, reportTokenFromRequest, setReportSessionCookie } from "@/lib/security/report-session";

const firstId = "f8c8fa12-f8e7-4e98-9ef1-6b734067bc9d";
const secondId = "7cd040c3-dbd9-4679-bbf3-6c14a0898876";
const firstToken = "a".repeat(43);
const secondToken = "b".repeat(43);

function browserCookies() {
  const jar = new Map<string, string>();
  for (const [id, token] of [[firstId, firstToken], [secondId, secondToken]]) {
    const response = NextResponse.json({ ok: true });
    setReportSessionCookie(response, token, new Date(Date.now() + 60_000), id);
    response.cookies.getAll().forEach(cookie => jar.set(cookie.name, cookie.value));
  }
  return { jar, header: () => [...jar].map(([name, value]) => `${name}=${value}`).join("; ") };
}

describe("independent private report sessions", () => {
  it("keeps both reports readable after a second upload and refresh", () => {
    const cookies = browserCookies();
    for (const [id, token] of [[firstId, firstToken], [secondId, secondToken]]) {
      expect(reportTokenFromRequest(new Request(`https://cvunfold.com/api/report?id=${id}`, { headers: { cookie: cookies.header() } }))).toBe(token);
      expect(reportTokenFromRequest(new Request("https://cvunfold.com/api/report/revisions", { headers: { cookie: cookies.header(), "X-Report-ID": id } }))).toBe(token);
    }
  });

  it("rejects conflicting report identities rather than acting on another report", () => {
    const cookies = browserCookies();
    expect(reportTokenFromRequest(new Request(`https://cvunfold.com/api/report?id=${firstId}`, { headers: { cookie: cookies.header(), "X-Report-ID": secondId } }))).toBeNull();
  });

  it("retains the existing legacy session for a generic report link", () => {
    const cookies = browserCookies();
    expect(reportTokenFromRequest(new Request("https://cvunfold.com/api/report", { headers: { cookie: cookies.header() } }))).toBe(secondToken);
  });

  it("clears only the selected scoped report when deleting it", () => {
    const cookies = browserCookies();
    const response = NextResponse.json({ ok: true });
    clearReportSessionCookie(response, secondId);
    response.cookies.getAll().forEach(cookie => cookies.jar.delete(cookie.name));
    expect(cookies.jar.has(REPORT_SESSION_COOKIE)).toBe(false);
    expect(reportTokenFromRequest(new Request(`https://cvunfold.com/api/report?id=${firstId}`, { headers: { cookie: cookies.header() } }))).toBe(firstToken);
    expect(reportTokenFromRequest(new Request(`https://cvunfold.com/api/report?id=${secondId}`, { headers: { cookie: cookies.header() } }))).toBeNull();
  });

  it("does not fall back to another token for a malformed scoped cookie", () => {
    const cookie = `${REPORT_SESSION_COOKIE}=${secondToken}; ${REPORT_SESSION_COOKIE}_${firstId}=%invalid`;
    expect(reportTokenFromRequest(new Request(`https://cvunfold.com/api/report?id=${firstId}`, { headers: { cookie } }))).toBeNull();
  });
});
