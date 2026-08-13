"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clearPendingAnalytics,
  configureAdsPurchaseDestination,
  flushPendingAnalytics,
  markAnalyticsReady,
  readConsent,
  resetAnalyticsReady,
  safeAnalyticsLocation,
  safeAnalyticsPath,
  trackAnalyticsEvent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics/client";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LANDING_VARIANT } from "@/lib/audience";

type Props = { analyticsId?: string; adsId?: string; adsConversionLabel?: string };

export function GoogleAnalytics({ analyticsId, adsId, adsConversionLabel }: Props) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const enabled = Boolean(analyticsId || adsId);
  const locale: Locale = pathname.startsWith("/en") ? "en" : "pl";
  const isSensitivePage = pathname === "/raport" || pathname === "/en/report" || pathname.includes("/raport/");

  useEffect(() => {
    configureAdsPurchaseDestination(adsId && adsConversionLabel ? `${adsId}/${adsConversionLabel}` : undefined);
  }, [adsConversionLabel, adsId]);

  useEffect(() => {
    if (!enabled) return;
    setChoice(readConsent());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || choice !== "granted") return;
    const pagePath = safeAnalyticsPath(pathname);
    const pageLocation = safeAnalyticsLocation(pathname, window.location.origin);
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    window.gtag?.("set", { page_path: pagePath, page_location: pageLocation });
    if (analyticsId) window.gtag?.("config", analyticsId, { send_page_view: false });
    if (adsId) window.gtag?.("config", adsId);
    const tagId = analyticsId || adsId;
    if (tagId && !document.querySelector('script[data-product-google-tag="true"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
      script.dataset.productGoogleTag = "true";
      document.head.appendChild(script);
    }
    markAnalyticsReady();
  }, [adsId, analyticsId, choice, enabled, pathname]);

  useEffect(() => {
    if (!enabled || isSensitivePage || choice !== "granted") return;
    const pagePath = safeAnalyticsPath(pathname);
    const pageLocation = safeAnalyticsLocation(pathname, window.location.origin);
    window.gtag?.("set", { page_path: pagePath, page_location: pageLocation });
    trackAnalyticsEvent("page_view", { locale, market: locale, landing_variant: DEFAULT_LANDING_VARIANT });
    if (pathname === "/" || pathname === "/en") {
      trackAnalyticsEvent("landing_view", { locale, market: locale, landing_variant: DEFAULT_LANDING_VARIANT });
    }
  }, [choice, enabled, isSensitivePage, locale, pathname]);

  useEffect(() => {
    if (!enabled || isSensitivePage) return;
    function trackClick(event: MouseEvent) {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;
      const eventName = element.dataset.analyticsEvent;
      if (eventName === "hero_cta_clicked") {
        trackAnalyticsEvent(eventName, {
          locale,
          market: locale,
          placement: element.dataset.analyticsPlacement || "unknown",
          landing_variant: DEFAULT_LANDING_VARIANT,
        });
      }
    }
    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, [enabled, isSensitivePage, locale]);

  if (!enabled || isSensitivePage) return null;

  function choose(next: ConsentChoice) {
    const wasGranted = readConsent() === "granted";
    writeConsent(next);
    setChoice(next);
    setSettingsOpen(false);
    if (next === "granted") flushPendingAnalytics();
    else {
      resetAnalyticsReady();
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
  const copy = locale === "en" ? {
    eyebrow: "PRIVACY",
    title: `Help us improve ${brand.name}`,
    body: "With your consent, we use Google tools for statistics and ad measurement. We never send CV, job-description or report content.",
    reject: "Necessary only",
    accept: "Accept",
    settings: "Privacy settings",
  } : {
    eyebrow: "PRYWATNOŚĆ",
    title: `Pomóż nam ulepszać ${brand.name}`,
    body: "Za zgodą użyjemy narzędzi Google do statystyk i pomiaru reklam. Nie wysyłamy treści CV, ogłoszeń ani raportów.",
    reject: "Tylko niezbędne",
    accept: "Zgadzam się",
    settings: "Ustawienia prywatności",
  };
  return <>
    {showBanner ? <aside className="consent-banner" aria-labelledby="consent-title" aria-describedby="consent-copy">
      <div>
        <span>{copy.eyebrow}</span>
        <h2 id="consent-title">{copy.title}</h2>
        <p id="consent-copy">{copy.body}</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-secondary" onClick={() => choose("denied")}>{copy.reject}</button>
        <button type="button" className="button" onClick={() => choose("granted")}>{copy.accept}</button>
      </div>
    </aside> : <button type="button" className="privacy-settings" onClick={() => setSettingsOpen(true)}>{copy.settings}</button>}
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
