"use client";

import { useCallback, useEffect, useState } from "react";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import { ReportWorkspaceTools } from "@/components/report-workspace-tools";
import "@/app/report-workspace.css";
import type { RevisionSummary } from "@/lib/data/store";
import type { Purchase } from "@/lib/data/store";
import type { Locale } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";
import { Logo } from "@/components/logo";
import { ReportView } from "@/components/report-view";
import { CONSENT_UPDATED_EVENT, trackAnalyticsEvent } from "@/lib/analytics/client";
import { trackLinkedInPurchase } from "@/lib/analytics/linkedin-client";
import type { MeasurementContext } from "@/lib/audience";
import { ACCESS_CODE_EVENT } from "@/lib/client/access-code";
import { reportRequestHeaders } from "@/lib/client/report-access";

type ReportResponse = {
  iterationsAvailable: boolean;
  analysisId: string;
  version: number;
  revisions: RevisionSummary[];
  rechecksRemaining: number;
  recheckRunning: boolean;
  paid: boolean;
  fullAccess?: boolean;
  accessMode?: "preview_test" | "access_code" | "purchase" | "teaser";
  plan: Plan;
  locale: Locale;
  expiresAt: string;
  report: CVReport | TeaserReport;
  purchase?: Purchase;
  measurementContext: MeasurementContext;
};

const messages = {
  pl: {
    loading: "Bezpiecznie otwieramy Twój raport…",
    pending: "Płatność jest potwierdzana. To zwykle trwa kilka sekund…",
    pendingLong: "Płatność nadal jest potwierdzana. Raport odblokuje się automatycznie po potwierdzeniu Stripe — odśwież stronę za chwilę.",
    cancelled: "Płatność została anulowana. Twój wynik wstępny nadal jest dostępny.",
    missing: "Ten link jest nieważny, raport wygasł albo został usunięty.",
    retry: "Spróbuj ponownie",
  },
  en: {
    loading: "Securely opening your report…",
    pending: "Your payment is being confirmed. This usually takes a few seconds…",
    pendingLong: "Payment is still being confirmed. The report will unlock after Stripe confirms it — refresh in a moment.",
    cancelled: "Checkout was cancelled. Your initial result is still available.",
    missing: "This link is invalid, or the report has expired or been deleted.",
    retry: "Try again",
  },
} as const;

export function ReportSessionPage({ locale, mockMode, testAccessEnabled = false, analysisId }: { analysisId?: string; locale: Locale; mockMode: boolean; testAccessEnabled?: boolean }) {
  const t = messages[locale];
  const [data, setData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testError, setTestError] = useState(false);
  const [notice, setNotice] = useState("");
  const [accessNoticeVisible, setAccessNoticeVisible] = useState(true);

  useEffect(() => {
    if (mockMode || !data?.paid || !data.purchase || data.accessMode !== "purchase") return;
    const { analysisId, purchase } = data;
    const send = () => { void trackLinkedInPurchase(analysisId, purchase.transactionId); };
    send();
    window.addEventListener(CONSENT_UPDATED_EVENT, send);
    window.addEventListener("online", send);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, send);
      window.removeEventListener("online", send);
    };
  }, [data, mockMode]);
  function showAccessNotice() {
    setAccessNoticeVisible(true);
    requestAnimationFrame(() => {
      const notice = document.getElementById("report-access-notice");
      notice?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      notice?.focus({ preventScroll: true });
    });
  }
  function dismissAccessNotice() {
    setAccessNoticeVisible(false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-report-access-toggle]")?.focus());
  }

  const load = useCallback(async (version?: number) => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const query = new URLSearchParams();
    if (sessionId) query.set("session_id", sessionId);
    const pathId = analysisId || window.location.pathname.match(/^\/(?:raport|en\/report)\/([a-f0-9-]{36})$/i)?.[1];
    if (pathId) query.set("id", pathId);
    if (version !== undefined) query.set("version", String(version));
    const search = query.toString();
    const url = `/api/report${search ? `?${search}` : ""}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const report = await response.json() as ReportResponse;
    setData(report);
    return report;
  }, [analysisId]);

  useEffect(() => {
    function refreshAfterCode() { void load().catch(() => setError(true)); }
    window.addEventListener(ACCESS_CODE_EVENT, refreshAfterCode);
    return () => window.removeEventListener(ACCESS_CODE_EVENT, refreshAfterCode);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const fragment = window.location.hash.slice(1);
      // Section anchors contain a colon, which private base64url tokens cannot.
      // A reload must keep the existing session rather than exchange the anchor.
      const token = fragment.startsWith("section:") ? "" : fragment;
      if (token) {
        const response = await fetch("/api/report-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...(analysisId ? { analysisId } : {}) }),
        });
        if (!response.ok) { if (!cancelled) setError(true); return; }
        const session = await response.json() as { path: string; locale: Locale };
        window.history.replaceState(null, "", `${session.path}${window.location.search}`);
        if (session.locale !== locale) { window.location.replace(`${session.path}${window.location.search}`); return; }
      }
      let report = await load();
      if (!report) { if (!cancelled) setError(true); return; }
      if (window.location.pathname === "/raport" || window.location.pathname === "/en/report") {
        const path = `${report.locale === "pl" ? "/raport" : "/en/report"}/${report.analysisId}`;
        window.history.replaceState(null, "", `${path}${window.location.search}${window.location.hash}`);
      }
      const checkoutState = new URLSearchParams(window.location.search).get("checkout");
      if (checkoutState === "cancelled") {
        await fetch("/api/report/checkout-event", { method: "POST", headers: reportRequestHeaders() }).catch(() => undefined);
        trackAnalyticsEvent("checkout_cancelled", { plan: report.plan, locale: report.locale, market: report.locale, ...report.measurementContext });
        if (!cancelled) setNotice(t.cancelled);
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (checkoutState === "success" && !(report.fullAccess ?? report.paid)) {
        if (!cancelled) setPending(true);
        for (let attempt = 0; attempt < 8 && !cancelled && !(report.fullAccess ?? report.paid); attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
          report = await load() || report;
        }
        if (!cancelled) setPending(false);
        if (!(report.fullAccess ?? report.paid) && !cancelled) setNotice(t.pendingLong);
      }
      if (checkoutState === "success" && report.paid) window.history.replaceState(null, "", window.location.pathname);
    }
    void bootstrap().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [load, locale, analysisId, t.cancelled, t.pendingLong]);

  async function unlockTest(event: React.FormEvent) {
    event.preventDefault();
    setTestBusy(true); setTestError(false);
    try {
      const response = await fetch("/api/report/test-access", { method: "POST", headers: reportRequestHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ code: testCode }) });
      setTestCode("");
      if (!response.ok || !await load()) setTestError(true);
    } catch { setTestError(true); } finally { setTestBusy(false); }
  }

  if (error) return <main className="report-state"><Logo locale={locale}/><h1>{t.missing}</h1><button className="button" onClick={() => window.location.reload()}>{t.retry}</button></main>;
  if (!data || pending) return <main className="report-state report-loading-state"><div className="report-loading-card" role="status" aria-live="polite" aria-atomic="true"><Logo locale={locale}/><div className="report-loading-ring" aria-hidden="true"/><h1>{pending ? t.pending : t.loading}</h1></div></main>;
  const testAccessForm = testAccessEnabled && !data.paid && data.accessMode !== "access_code" && data.accessMode !== "preview_test" ? <section className="report-test-access" aria-label={locale === "pl" ? "Dostęp testowy" : "Test access"}>
    <form onSubmit={unlockTest}>
      <label>{locale === "pl" ? "Kod dostępu testowego" : "Test access code"}<input type="password" autoComplete="off" maxLength={256} value={testCode} onChange={event => setTestCode(event.target.value)} disabled={testBusy}/></label>
      <button className="button" disabled={testBusy || !testCode}>{locale === "pl" ? "Otwórz raport testowo" : "Open report for testing"}</button>
      {testError ? <p role="alert">{locale === "pl" ? "Nie udało się przyznać dostępu testowego." : "Test access could not be granted."}</p> : null}
    </form>
  </section> : null;
  return <><ReportWorkspaceTools accessVisible={accessNoticeVisible} onDismissAccess={dismissAccessNotice} analysisId={data.analysisId} locale={data.locale} fullAccess={(data.fullAccess ?? data.paid) && data.plan === "full_review" && data.iterationsAvailable !== false} remaining={data.rechecksRemaining} running={data.recheckRunning} version={data.version} revisions={data.revisions} onVersion={load}/>{notice ? <div className="payment-notice" role="status">{notice}</div> : null}<ReportView feedbackVersion={data.version || 0} onShowAccessNotice={accessNoticeVisible ? undefined : showAccessNotice} testAccessForm={testAccessForm} paid={data.fullAccess ?? data.paid} testAccess={data.accessMode === "preview_test"} plan={data.plan} purchase={data.purchase} data={data.report} locale={data.locale} expiresAt={data.expiresAt} mockMode={mockMode} measurementContext={data.measurementContext}/></>;
}
