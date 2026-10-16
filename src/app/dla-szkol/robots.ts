import type { MetadataRoute } from "next";
import { schoolSiteOrigin } from "@/lib/schools/urls";
import { SITE_URL } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const origin = schoolSiteOrigin() || SITE_URL;
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dla-szkol/panel", "/dla-szkol/potwierdz", "/dla-szkol/demo"] }, sitemap: `${origin}/sitemap.xml`, host: origin };
}
