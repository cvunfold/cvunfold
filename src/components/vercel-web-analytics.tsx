"use client";

import { Analytics } from "@vercel/analytics/next";
import { safeAnalyticsPath } from "@/lib/analytics/client";
import {
  marketingAttributionFromSearch,
  marketingAttributionKeys,
  marketingAttributionToSearch,
} from "@/lib/analytics/safe-attribution";

/**
 * Vercel Web Analytics reports the page URL verbatim, and a report page carries the
 * token that unlocks it in the fragment. Rebuilding the URL from its parts drops the
 * fragment outright; safeAnalyticsPath then collapses report paths and the query is
 * dropped entirely on them.
 *
 * Deliberately narrower than safeAnalyticsLocation, which Google gets: that one also
 * forwards gclid/gbraid/wbraid, because Google Ads needs the click identifier to
 * attribute a conversion. Vercel has no such purpose, so a click identifier here
 * would be a personal identifier shared with a processor that cannot use it. Only
 * the utm_* campaign labels survive.
 *
 * An unparseable URL returns null so the event is dropped — forwarding it untouched
 * is the one outcome this guard exists to prevent.
 */
export function safeVercelAnalyticsUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const path = safeAnalyticsPath(url.pathname);
    const isReport = path === "/raport" || path === "/en/report";
    const attribution = marketingAttributionFromSearch(url.search);
    const campaignOnly = Object.fromEntries(marketingAttributionKeys.map((key) => [key, attribution[key]]));
    return `${url.origin}${path}${isReport ? "" : marketingAttributionToSearch(campaignOnly)}`;
  } catch {
    return null;
  }
}

// Not consent-gated: Web Analytics is cookieless and stores no identifier, so it
// runs on legitimate interest — see PRIVACY_AND_RETENTION.md.
export function VercelWebAnalytics() {
  return <Analytics beforeSend={(event) => {
    const url = safeVercelAnalyticsUrl(event.url);
    return url ? { ...event, url } : null;
  }}/>;
}
