// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { safeVercelAnalyticsUrl } from "@/components/vercel-web-analytics";

describe("what Vercel Web Analytics is allowed to see", () => {
  it("measures public school offers without enquiry details", () => {
    for (const path of ["/dla-szkol", "/en/for-schools"]) {
      expect(safeVercelAnalyticsUrl(`https://cvunfold.com${path}?utm_source=linkedin&email=mentor@example.com&school=Private&gclid=private#message`)).toBe(`https://cvunfold.com${path}?utm_source=linkedin`);
    }
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/en/for-schools/panel?code=secret")).toBeNull();
  });
  it("removes the unique report ID from English report analytics", () => {
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/en/report/11111111-1111-4111-8111-111111111111#private-key")).toBe("https://cvunfold.com/en/report");
  });
  it("drops school panel and login callback events entirely", () => {
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/dla-szkol/potwierdz?code=private-auth-code")).toBeNull();
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/dla-szkol/panel?report=private-student-id")).toBeNull();
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/dla-szkol/demo")).toBeNull();
  });
  it("never forwards the report access token that lives in the fragment", () => {
    // This is the whole reason the hook exists: /raport carries the token that
    // unlocks a private report, and Web Analytics reports the page URL verbatim.
    const url = safeVercelAnalyticsUrl("https://cvunfold.com/raport#secret-access-token");
    expect(url).toBe("https://cvunfold.com/raport");
    expect(url).not.toContain("secret-access-token");
  });

  it("strips the query from report pages entirely, in both locales", () => {
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/raport?session_id=cs_live_abc&utm_source=google"))
      .toBe("https://cvunfold.com/raport");
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/en/report?session_id=cs_live_abc"))
      .toBe("https://cvunfold.com/en/report");
  });

  it("keeps marketing parameters on public pages so acquisition stays measurable", () => {
    const url = safeVercelAnalyticsUrl("https://cvunfold.com/?utm_source=google&utm_medium=cpc&gclid=private-click")!;
    expect(url).toContain("utm_source=google");
    expect(url).toContain("utm_medium=cpc");
    // Narrower than what Google gets on purpose: gclid is a personal identifier and
    // Vercel, unlike Google Ads, has no conversion to attribute with it.
    expect(url).not.toContain("private-click");
    expect(url).not.toContain("gclid");
  });

  it("collapses a tokenised report sub-path onto the bare report path", () => {
    expect(safeVercelAnalyticsUrl("https://cvunfold.com/raport/abc123?x=1")).toBe("https://cvunfold.com/raport");
  });

  it("drops the event rather than passing an unparseable URL through untouched", () => {
    expect(safeVercelAnalyticsUrl("not a url")).toBeNull();
  });
});
