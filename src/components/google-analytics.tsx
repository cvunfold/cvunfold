"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clearPendingAnalytics,
  flushPendingAnalytics,
  readConsent,
  safeAnalyticsLocation,
  safeAnalyticsPath,
  trackAnalyticsEvent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics/client";

type Props = { analyticsId?: string; adsId?: string };

export function GoogleAnalytics({ analyticsId, adsId }: Props) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const enabled = Boolean(analyticsId || adsId);

  useEffect(() => {
    if (!enabled) return;
    setChoice(readConsent());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || choice !== "granted") return;
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    if (analyticsId) window.gtag?.("config", analyticsId, { send_page_view: false });
    if (adsId) window.gtag?.("config", adsId);
    const tagId = analyticsId || adsId;
    if (tagId && !document.querySelector('script[data-cvunfold-google-tag="true"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
      script.dataset.cvunfoldGoogleTag = "true";
      document.head.appendChild(script);
    }
    flushPendingAnalytics();
  }, [adsId, analyticsId, choice, enabled]);

  useEffect(() => {
    if (!enabled || choice !== "granted") return;
    const pagePath = safeAnalyticsPath(pathname);
    const pageLocation = safeAnalyticsLocation(pathname, window.location.origin);
    window.gtag?.("set", { page_path: pagePath, page_location: pageLocation });
    trackAnalyticsEvent("page_view", { page_path: pagePath, page_location: pageLocation });
    if (pathname === "/pl") trackAnalyticsEvent("landing_view");
  }, [choice, enabled, pathname]);

  useEffect(() => {
    if (!enabled) return;
    function trackClick(event: MouseEvent) {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;
      const eventName = element.dataset.analyticsEvent;
      if (eventName === "primary_cta_clicked" || eventName === "demo_report_viewed") {
        trackAnalyticsEvent(eventName, { placement: element.dataset.analyticsPlacement || "unknown" });
      }
    }
    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, [enabled]);

  if (!enabled) return null;

  function choose(next: ConsentChoice) {
    const wasGranted = readConsent() === "granted";
    writeConsent(next);
    setChoice(next);
    setSettingsOpen(false);
    if (next === "granted") flushPendingAnalytics();
    else {
      clearPendingAnalytics();
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      if (wasGranted) window.location.reload();
    }
  }

  const showBanner = choice === null || settingsOpen;
  return <>
    {showBanner ? <aside className="consent-banner" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-copy">
      <div>
        <span>PRYWATNOŚĆ</span>
        <h2 id="consent-title">Pomóż nam ulepszać CVUnfold</h2>
        <p id="consent-copy">Za zgodą użyjemy narzędzi Google do statystyk i pomiaru reklam. Nie wysyłamy treści CV, ogłoszeń ani raportów.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-secondary" onClick={() => choose("denied")}>Tylko niezbędne</button>
        <button type="button" className="button" onClick={() => choose("granted")}>Zgadzam się</button>
      </div>
    </aside> : <button type="button" className="privacy-settings" onClick={() => setSettingsOpen(true)}>Ustawienia prywatności</button>}
  </>;
}

export const googleConsentDefaults = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
`;
