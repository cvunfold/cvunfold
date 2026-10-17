import type { Metadata, Viewport } from "next";
import { DocumentLanguage } from "@/components/document-language";
import { AccessCodeDialog } from "@/components/access-code-dialog";
import { reportAccessCodesEnabled } from "@/lib/security/report-access-code";
import { GoogleAnalytics, googleConsentDefaults } from "@/components/google-analytics";
import { VercelWebAnalytics } from "@/components/vercel-web-analytics";
import { brand } from "@/lib/brand";
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";
import "./form-controls.css";
import "./product-redesign.css";
import "./document-scanner.css";
import "./uploaded-cv-preview.css";
import "./cv-flow-preview.css";
import "./cv-story.css";
import "./report-polish.css";
import "./site-topbar.css";
import "./article-content.css";
import "./disclosures.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Analiza CV developera | ${brand.name}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "career",
  classification: "Analiza CV i rozwój kariery w branży technologicznej",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "/",
    siteName: SITE_NAME,
    title: `Analiza CV developera | ${brand.name}`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${brand.name} — analiza CV developera` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Analiza CV developera | ${brand.name}`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", alt: `${brand.name} — analiza CV developera` }],
  },
  alternates: { types: { "application/rss+xml": "/artykuly/feed.xml" } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07162f",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const adsConversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
  const analyticsEnabled = process.env.MOCK_MODE !== "true" && Boolean(analyticsId || adsId || process.env.NEXT_PUBLIC_LINKEDIN_CONVERSIONS_ENABLED === "true");
  return <html lang="pl" data-scroll-behavior="smooth" suppressHydrationWarning>
    {analyticsEnabled ? <head><script dangerouslySetInnerHTML={{ __html: googleConsentDefaults }} /></head> : null}
    <body>
      <DocumentLanguage />
      {children}
      {reportAccessCodesEnabled() ? <AccessCodeDialog/> : null}
      {analyticsEnabled ? <GoogleAnalytics analyticsId={analyticsId} adsId={adsId} adsConversionLabel={adsConversionLabel} /> : null}
      {process.env.MOCK_MODE !== "true" ? <VercelWebAnalytics /> : null}
    </body>
  </html>;
}
