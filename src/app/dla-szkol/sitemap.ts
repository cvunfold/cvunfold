import type { MetadataRoute } from "next";
import { schoolsPath } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["pl", "en"].map(locale => ({ url: absoluteUrl(schoolsPath(locale as "pl" | "en")) }));
}
