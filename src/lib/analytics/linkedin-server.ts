import { createHash } from "node:crypto";
import type { Purchase } from "@/lib/data/store";
import { validLinkedInClickId } from "./linkedin-shared";

export function linkedInConversionsConfigured(): boolean {
  return process.env.VERCEL_ENV === "production" && process.env.MOCK_MODE !== "true"
    && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED === "true"
    && /^\d+$/.test(process.env.LINKEDIN_PURCHASE_CONVERSION_ID || "")
    && Boolean(process.env.LINKEDIN_CONVERSIONS_ACCESS_TOKEN);
}

export function linkedInPurchasePayload(purchase: Purchase, clickId: string, conversionId: string, now = Date.now()) {
  const happenedAt = Date.parse(purchase.paidAt || "");
  if (!/^\d+$/.test(conversionId) || !validLinkedInClickId(clickId) || !purchase.transactionId.startsWith("cs_live_")
    || !Number.isFinite(purchase.value) || purchase.value <= 0 || !/^[A-Z]{3}$/.test(purchase.currency)
    || !Number.isFinite(happenedAt) || happenedAt > now || now - happenedAt > 90 * 86_400_000) return null;
  return {
    conversion: `urn:lla:llaPartnerConversion:${conversionId}`,
    conversionHappenedAt: happenedAt,
    conversionValue: { currencyCode: purchase.currency, amount: purchase.value.toFixed(2) },
    user: { userIds: [{ idType: "LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID", idValue: clickId }] },
    // No Stripe identifier, private URL or report content leaves the application.
    eventId: createHash("sha256").update(`cvunfold:linkedin:purchase:${purchase.transactionId}`).digest("hex"),
  };
}

export async function sendLinkedInPurchase(purchase: Purchase, clickId: string): Promise<boolean> {
  if (!linkedInConversionsConfigured()) return false;
  const payload = linkedInPurchasePayload(purchase, clickId, process.env.LINKEDIN_PURCHASE_CONVERSION_ID!);
  if (!payload) return false;
  const response = await fetch("https://api.linkedin.com/rest/conversionEvents", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000),
    headers: {
      Authorization: `Bearer ${process.env.LINKEDIN_CONVERSIONS_ACCESS_TOKEN}`,
      "Content-Type": "application/json", "LinkedIn-Version": "202609", "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });
  // Never log the response body: it can echo matching identifiers.
  if (response.status !== 201) throw new Error(`LINKEDIN_CONVERSION_HTTP_${response.status}`);
  return true;
}
