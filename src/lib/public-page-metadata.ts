import type { Metadata } from "next";
import { brand } from "./brand";
import type { Locale } from "@/lib/i18n";
import { schoolSiteOrigin, schoolOfferPath } from "@/lib/schools/urls";

export function publicSocialMetadata(locale: Locale, { title, description, path }: { title: string; description: string; path: string }): Pick<Metadata, "openGraph" | "twitter"> {
  const image = path === "/dla-szkol" ? "/dla-szkol/opengraph-image"
    : path === "/en/for-schools" ? "/en/for-schools/opengraph-image"
    : locale === "en" ? "/en/opengraph-image" : "/opengraph-image";
  const schoolOrigin = path === "/dla-szkol" || path === "/en/for-schools" ? schoolSiteOrigin() : null;
  const images = [{ url: schoolOrigin ? `${schoolOrigin}${image}` : image, width: 1200, height: 630, alt: title }];
  return {
    openGraph: { title, description, url: schoolOrigin ? schoolOfferPath(locale) : path, type: "website", siteName: brand.name, images, locale: locale === "pl" ? "pl_PL" : "en_US" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
