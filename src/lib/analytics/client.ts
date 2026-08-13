"use client";

import { safeAnalyticsPayload, type AnalyticsEvent } from "./events";
import { parseAttribution } from "./attribution";
import type { MeasurementContext } from "@/lib/audience";
import { brandStorageKey } from "@/lib/brand";

export const CONSENT_STORAGE_KEY = brandStorageKey("google-consent");
const LEGACY_CONSENT_STORAGE_KEY = "cvunfold_google_consent_v1";
export const CONSENT_UPDATED_EVENT = "cv-review:consent-updated";

export type ConsentChoice = "granted" | "denied";
type AnalyticsProperties = Record<string, string | number | boolean>;
type PurchaseConversion = { transactionId: string; value: number; currency: string; plan: "full_review" | "job_match"; locale: "pl" | "en"; market: "pl" | "en" } & Partial<MeasurementContext>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const pendingEvents: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties }> = [];
let pendingPurchase: PurchaseConversion | null = null;
let adsPurchaseDestination: string | null = null;
let analyticsReady = false;

export function configureAdsPurchaseDestination(value?: string): void {
  adsPurchaseDestination = value && /^AW-\d+\/[\w-]+$/.test(value) ? value : null;
}

export function markAnalyticsReady(): void {
  analyticsReady = true;
  flushPendingAnalytics();
}

export function resetAnalyticsReady(): void {
  analyticsReady = false;
}

export function safeAnalyticsPath(pathname: string): string {
  if (pathname === "/raport" || pathname === "/en/report" || pathname.includes("/raport/")) return pathname.startsWith("/en") ? "/en/report" : "/raport";
  return pathname.slice(0, 160);
}

export function safeAnalyticsLocation(pathname: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}${safeAnalyticsPath(pathname)}`;
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY) || window.localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY);
  if (!window.localStorage.getItem(CONSENT_STORAGE_KEY) && (value === "granted" || value === "denied")) window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  return value === "granted" || value === "denied" ? value : null;
}

export function writeConsent(value: ConsentChoice): void {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: value }));
}

export function readSafeAttribution(): AnalyticsProperties {
  if (typeof window === "undefined") return {};
  const key = brandStorageKey("attribution");
  const params = new URLSearchParams(window.location.search);
  const fromUrl = Object.fromEntries([
    ["source", params.get("utm_source")],
    ["medium", params.get("utm_medium")],
    ["campaign", params.get("utm_campaign")],
    ["content", params.get("utm_content")],
    ["term", params.get("utm_term")],
    ["gclid", params.get("gclid")],
    ["gbraid", params.get("gbraid")],
    ["wbraid", params.get("wbraid")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1])).map(([name, value]) => [name, value.slice(0, 120)]));
  if (Object.keys(fromUrl).length) window.sessionStorage.setItem(key, JSON.stringify(fromUrl));
  try {
    return parseAttribution({ ...JSON.parse(window.sessionStorage.getItem(key) || "{}"), ...fromUrl });
  } catch {
    return parseAttribution(fromUrl);
  }
}

function sendEvent(event: AnalyticsEvent, properties: AnalyticsProperties): void {
  const payload = safeAnalyticsPayload(event, { ...readSafeAttribution(), ...properties });
  window.gtag?.("event", payload.event, payload.properties);
}

export function trackAnalyticsEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted" || !analyticsReady) {
    if (pendingEvents.length < 20) pendingEvents.push({ event, properties });
    return;
  }
  sendEvent(event, properties);
}

export function trackPurchaseConversion(purchase: PurchaseConversion): void {
  if (typeof window === "undefined") return;
  const key = brandStorageKey(`purchase:${purchase.transactionId}`);
  if (window.localStorage.getItem(key)) return;
  if (readConsent() !== "granted" || !analyticsReady) {
    pendingPurchase = purchase;
    return;
  }
  sendPurchase(purchase);
}

function sendPurchase(purchase: PurchaseConversion): void {
  const properties = {
    transaction_id: purchase.transactionId,
    value: purchase.value,
    currency: purchase.currency,
    plan: purchase.plan,
    locale: purchase.locale,
    market: purchase.market,
    ...(purchase.landing_variant ? { landing_variant: purchase.landing_variant } : {}),
    ...(purchase.broad_role_enum ? { broad_role_enum: purchase.broad_role_enum } : {}),
    ...(purchase.selected_seniority_enum ? { selected_seniority_enum: purchase.selected_seniority_enum } : {}),
    ...(purchase.handoff_origin ? { handoff_origin: purchase.handoff_origin } : {}),
  };
  sendEvent("purchase", properties);
  if (adsPurchaseDestination) {
    window.gtag?.("event", "conversion", {
      send_to: adsPurchaseDestination,
      transaction_id: purchase.transactionId,
      value: purchase.value,
      currency: purchase.currency,
    });
  }
  window.localStorage.setItem(brandStorageKey(`purchase:${purchase.transactionId}`), "1");
}

export function flushPendingAnalytics(): void {
  if (typeof window === "undefined" || readConsent() !== "granted" || !analyticsReady) return;
  while (pendingEvents.length) {
    const item = pendingEvents.shift();
    if (item) sendEvent(item.event, item.properties);
  }
  if (pendingPurchase) {
    const purchase = pendingPurchase;
    pendingPurchase = null;
    sendPurchase(purchase);
  }
}

export function clearPendingAnalytics(): void {
  pendingEvents.length = 0;
  pendingPurchase = null;
}
