"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LANDING_VARIANT } from "@/lib/audience";

export function PricingObserver({ locale, targetId }: { locale: Locale; targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let sent = false;
    const observer = new IntersectionObserver((entries) => {
      if (!sent && entries.some((entry) => entry.isIntersecting)) {
        sent = true;
        trackAnalyticsEvent("pricing_viewed", { locale, market: locale, landing_variant: DEFAULT_LANDING_VARIANT });
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [locale, targetId]);
  return null;
}
