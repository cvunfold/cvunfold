"use client";

import { useCallback, useEffect, useState } from "react";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import type { Purchase } from "@/lib/data/store";
import type { Locale } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";
import { Logo } from "@/components/logo";
import { ReportView } from "@/components/report-view";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { MeasurementContext } from "@/lib/audience";

type ReportResponse = {
  paid: boolean;
  fullAccess?: boolean;
  accessMode?: "preview_test" | "purchase" | "teaser";
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

export function ReportSessionPage({ locale, mockMode, testAccessEnabled = false }: { locale: Locale; mockMode: boolean; testAccessEnabled?: boolean }) {
  const t = messages[locale];
  const [data, setData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testError, setTestError] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const url = sessionId ? `/api/report?session_id=${encodeURIComponent(sessionId)}` : "/api/report";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const report = await response.json() as ReportResponse;
    setData(report);
    return report;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const token = window.location.hash.slice(1);
      if (token) {
        const response = await fetch("/api/report-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) { if (!cancelled) setError(true); return; }
        const session = await response.json() as { path: string; locale: Locale };
        window.history.replaceState(null, "", `${session.path}${window.location.search}`);
        if (session.locale !== locale) { window.location.replace(`${session.path}${window.location.search}`); return; }
      }
      let report = await load();
      if (!report) { if (!cancelled) setError(true); return; }
      const checkoutState = new URLSearchParams(window.location.search).get("checkout");
      if (checkoutState === "cancelled") {
        await fetch("/api/report/checkout-event", { method: "POST" }).catch(() => undefined);
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
    void bootstrap();
    return () => { cancelled = true; };
  }, [load, locale, t.cancelled, t.pendingLong]);

  async function unlockTest(event: React.FormEvent) {
    event.preventDefault();
    setTestBusy(true); setTestError(false);
    try {
      const response = await fetch("/api/report/test-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: testCode }) });
      setTestCode("");
      if (!response.ok || !await load()) setTestError(true);
    } catch { setTestError(true); } finally { setTestBusy(false); }
  }

  if (error) return <main className="report-state"><Logo locale={locale}/><h1>{t.missing}</h1><button className="button" onClick={() => window.location.reload()}>{t.retry}</button></main>;
  if (!data || pending) return <main className="report-state"><Logo locale={locale}/><div className="analysis-spinner"/><h1>{pending ? t.pending : t.loading}</h1></main>;
  return <>{testAccessEnabled ? <section className="payment-notice" aria-label={locale === "pl" ? "Dostęp testowy" : "Test access"}>
    {data.accessMode === "preview_test" ? <p role="status">{locale === "pl" ? "Dostęp testowy do raportu. Płatność nie została wykonana." : "Test access to this report. No payment was made."}</p> : !data.paid ? <form onSubmit={unlockTest}>
      <label>{locale === "pl" ? "Kod dostępu testowego" : "Test access code"}<input type="password" autoComplete="off" maxLength={256} value={testCode} onChange={event => setTestCode(event.target.value)} disabled={testBusy}/></label>
      <button className="button" disabled={testBusy || !testCode}>{locale === "pl" ? "Otwórz raport testowo" : "Open report for testing"}</button>
      {testError ? <p role="alert">{locale === "pl" ? "Nie udało się przyznać dostępu testowego." : "Test access could not be granted."}</p> : null}
    </form> : null}
  </section> : null}{notice ? <div className="payment-notice" role="status">{notice}</div> : null}<ReportView paid={data.fullAccess ?? data.paid} testAccess={data.accessMode === "preview_test"} plan={data.plan} purchase={data.purchase} data={data.report} locale={data.locale} expiresAt={data.expiresAt} mockMode={mockMode} measurementContext={data.measurementContext}/></>;
}
