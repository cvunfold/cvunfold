"use client";

import { safeAnalyticsPayload, type AnalyticsEvent } from "./events";

export const CONSENT_STORAGE_KEY = "cvunfold_google_consent_v1";
export const CONSENT_UPDATED_EVENT = "cvunfold:consent-updated";

export type ConsentChoice = "granted" | "denied";
type AnalyticsProperties = Record<string, string | number | boolean>;
type PurchaseConversion = { transactionId: string; value: number; currency: string; plan: "full_review" | "job_match" };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const pendingEvents: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties }> = [];
let pendingPurchase: PurchaseConversion | null = null;

export function safeAnalyticsPath(pathname: string): string {
  if (pathname.startsWith("/pl/raport/")) return "/pl/raport/:token";
  return pathname.slice(0, 160);
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function writeConsent(value: ConsentChoice): void {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: value }));
}

function safeAttribution(): AnalyticsProperties {
  if (typeof window === "undefined") return {};
  const key = "cvunfold_attribution_v1";
  const params = new URLSearchParams(window.location.search);
  const fromUrl = Object.fromEntries([
    ["source", params.get("utm_source")],
    ["medium", params.get("utm_medium")],
    ["campaign", params.get("utm_campaign")],
    ["content", params.get("utm_content")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1])).map(([name, value]) => [name, value.slice(0, 120)]));
  if (Object.keys(fromUrl).length) window.sessionStorage.setItem(key, JSON.stringify(fromUrl));
  try {
    return { ...JSON.parse(window.sessionStorage.getItem(key) || "{}"), ...fromUrl };
  } catch {
    return fromUrl;
  }
}

function sendEvent(event: AnalyticsEvent, properties: AnalyticsProperties): void {
  const payload = safeAnalyticsPayload(event, { ...safeAttribution(), ...properties });
  window.gtag?.("event", payload.event, payload.properties);
}

export function trackAnalyticsEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") {
    if (pendingEvents.length < 20) pendingEvents.push({ event, properties });
    return;
  }
  sendEvent(event, properties);
}

export function trackPurchaseConversion(purchase: PurchaseConversion): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(`cvunfold_purchase_${purchase.transactionId}`)) return;
  if (readConsent() !== "granted") {
    pendingPurchase = purchase;
    return;
  }
  sendPurchase(purchase);
}

function sendPurchase(purchase: PurchaseConversion): void {
  const conversionDestination = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION;
  const properties = {
    transaction_id: purchase.transactionId,
    value: purchase.value,
    currency: purchase.currency,
    plan: purchase.plan,
  };
  sendEvent("purchase_completed", properties);
  if (conversionDestination) window.gtag?.("event", "conversion", { ...properties, send_to: conversionDestination });
  window.sessionStorage.setItem(`cvunfold_purchase_${purchase.transactionId}`, "1");
}

export function flushPendingAnalytics(): void {
  if (typeof window === "undefined" || readConsent() !== "granted") return;
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
