import { resolvePublicSiteUrl } from "./public-site-url";

export const PRODUCT_ID = "cv-review" as const;

export type BrandConfig = {
  name: string;
  wordmarkPrefix: string;
  wordmarkAccent: string;
  monogram: string;
  siteUrl: string;
  supportEmail?: string;
};

const prefix = process.env.NEXT_PUBLIC_BRAND_PREFIX?.trim() || "CV";
const accent = process.env.NEXT_PUBLIC_BRAND_ACCENT?.trim() || "Unfold";

export const brand: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || `${prefix} ${accent}`,
  wordmarkPrefix: prefix,
  wordmarkAccent: accent,
  monogram: process.env.NEXT_PUBLIC_BRAND_MONOGRAM?.trim() || "CV",
  siteUrl: resolvePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || undefined,
};

export function brandStorageKey(scope: string, version = 1): string {
  return `${PRODUCT_ID}:${scope}:v${version}`;
}
