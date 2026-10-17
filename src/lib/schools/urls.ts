import type { Locale } from "@/lib/i18n";

export const SCHOOL_HOST = "szkoly.cvunfold.com";
export function schoolSiteOrigin(value = process.env.NEXT_PUBLIC_SCHOOLS_URL): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== SCHOOL_HOST || url.port || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("SCHOOLS_SITE_URL_INVALID");
  return url.origin;
}
export function schoolOfferPath(locale: Locale): string {
  const origin = schoolSiteOrigin();
  return origin ? `${origin}${locale === "pl" ? "/" : "/en/for-schools"}` : locale === "pl" ? "/dla-szkol" : "/en/for-schools";
}
