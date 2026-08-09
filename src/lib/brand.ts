export const PRODUCT_ID = "cv-review" as const;

export type BrandConfig = {
  name: string;
  wordmarkPrefix: string;
  wordmarkAccent: string;
  monogram: string;
  siteUrl: string;
  supportEmail?: string;
};

const prefix = process.env.NEXT_PUBLIC_BRAND_PREFIX?.trim() || "Meri";
const accent = process.env.NEXT_PUBLIC_BRAND_ACCENT?.trim() || "vela";

export const brand: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || `${prefix}${accent}`,
  wordmarkPrefix: prefix,
  wordmarkAccent: accent,
  monogram: process.env.NEXT_PUBLIC_BRAND_MONOGRAM?.trim() || "M",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://cvunfold.pl",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || undefined,
};

export function brandStorageKey(scope: string, version = 1): string {
  return `${PRODUCT_ID}:${scope}:v${version}`;
}
