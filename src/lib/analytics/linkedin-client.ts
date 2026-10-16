"use client";

import { brandStorageKey } from "@/lib/brand";
import { readConsent } from "./client";
import { isPrivateSchoolPage } from "./school-pages";
import { LINKEDIN_CLICK_MAX_AGE_MS, MEASUREMENT_CONSENT_VERSION, validLinkedInClickId } from "./linkedin-shared";

export const LINKEDIN_CLICK_STORAGE_KEY = brandStorageKey("linkedin-click");
const inFlight = new Set<string>();

export function clearLinkedInAttribution(): void {
  try { window.localStorage.removeItem(LINKEDIN_CLICK_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}

export function readLinkedInClickId(): string | null {
  if (typeof window === "undefined" || readConsent() !== "granted") return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(LINKEDIN_CLICK_STORAGE_KEY) || "null");
    const age = Date.now() - stored?.capturedAt;
    if (stored?.consentVersion === MEASUREMENT_CONSENT_VERSION && validLinkedInClickId(stored.id)
      && Number.isFinite(age) && age >= 0 && age <= LINKEDIN_CLICK_MAX_AGE_MS) return stored.id;
  } catch { /* Invalid or unavailable storage is not consent. */ }
  clearLinkedInAttribution();
  return null;
}

export function captureLinkedInAttribution(): void {
  if (process.env.NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED !== "true" || typeof window === "undefined") return;
  if (readConsent() !== "granted") { clearLinkedInAttribution(); return; }
  const { pathname, search } = window.location;
  if (/^\/(?:raport|en\/report)(?:\/|$)/.test(pathname) || isPrivateSchoolPage(pathname)) return;
  const id = new URLSearchParams(search).get("li_fat_id");
  if (!validLinkedInClickId(id)) { readLinkedInClickId(); return; }
  try {
    window.localStorage.setItem(LINKEDIN_CLICK_STORAGE_KEY, JSON.stringify({ id, capturedAt: Date.now(), consentVersion: MEASUREMENT_CONSENT_VERSION }));
  } catch { /* Optional measurement never interrupts the product. */ }
}

/** The browser supplies consent and the ad click only. The server owns the
 * transaction, value, currency, payment time and exclusion of free access. */
export async function trackLinkedInPurchase(analysisId: string, transactionId: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED !== "true" || typeof window === "undefined") return;
  const clickId = readLinkedInClickId();
  if (!clickId || inFlight.has(transactionId)) return;
  const key = brandStorageKey(`linkedin-purchase:${transactionId}`);
  try { if (window.localStorage.getItem(key)) return; } catch { return; }
  inFlight.add(transactionId);
  try {
    const response = await fetch("/api/report/linkedin-purchase", {
      method: "POST", credentials: "same-origin", cache: "no-store", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json", "x-report-id": analysisId },
      body: JSON.stringify({ clickId, consentVersion: MEASUREMENT_CONSENT_VERSION }),
    });
    if (response.ok && (await response.json()).sent === true) window.localStorage.setItem(key, "1");
  } catch { /* A later report visit retries with the same server deduplication ID. */ }
  finally { inFlight.delete(transactionId); }
}
