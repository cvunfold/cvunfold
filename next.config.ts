import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/security/csp";
import { SCHOOL_HOST, schoolSiteOrigin } from "./src/lib/schools/urls";

const googleAnalyticsEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
const stripeEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
export const defaultCrossOriginOpenerPolicy = "same-origin";
export const googlePayCrossOriginOpenerPolicy = "same-origin-allow-popups";
const csp = buildContentSecurityPolicy({
  googleEnabled: googleAnalyticsEnabled,
  stripeEnabled,
  turnstileEnabled,
  development: process.env.NODE_ENV === "development",
  schoolStorageUrl: process.env.SCHOOL_BACKGROUND_UPLOADS_ENABLED === "true" ? process.env.SUPABASE_URL : undefined,
});

const nextConfig: NextConfig = {
  distDir: process.env.CVUNFOLD_DEV_DIST_DIR || ".next",
  // Login codes must not appear in the development server's request logs.
  logging: { incomingRequests: { ignore: [/^\/dla-szkol\/potwierdz(?:\?|$)/, /^\/raport(?:\/|\?|$)/, /^\/en\/report(?:\/|\?|$)/, /^\/api\/report(?:\/|\?|$)/] } },
  poweredByHeader: false,
  // The Open Graph image routes load this font at runtime with `readFile`.
  // Keep it in Vercel's server trace even though the path is resolved dynamically.
  outputFileTracingIncludes: {
    "/*": ["./src/assets/og-font.ttf"],
  },
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
  async rewrites() {
    if (!schoolSiteOrigin()) return [];
    const has = [{ type: "host" as const, value: SCHOOL_HOST }];
    return { beforeFiles: [
      { source: "/", has, destination: "/dla-szkol" },
      { source: "/robots.txt", has, destination: "/dla-szkol/robots.txt" },
      { source: "/sitemap.xml", has, destination: "/dla-szkol/sitemap.xml" },
    ], afterFiles: [], fallback: [] };
  },
  async headers() {
    const privateRouteHeaders = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" };
    return [
      ...["/images/optimized/:path*", "/demo/schools/optimized/:path*"].map(source => ({ source, headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] })),
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: defaultCrossOriginOpenerPolicy },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
      { source: "/api/:path*", headers: [privateRouteHeaders] },
      ...["panel", "potwierdz", "demo"].map(path => ({ source: `/dla-szkol/${path}/:path*`, headers: [privateRouteHeaders, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Cache-Control", value: "private, no-store" }] })),
      { source: "/analiza", headers: [privateRouteHeaders, { key: "Referrer-Policy", value: "no-referrer" }] },
      {
        source: "/raport",
        headers: [
          privateRouteHeaders,
          { key: "Referrer-Policy", value: "no-referrer" },
          // Google Pay opens a cross-origin payment window. Keeping a strict
          // `same-origin` opener policy can prevent that window from opening.
          { key: "Cross-Origin-Opener-Policy", value: googlePayCrossOriginOpenerPolicy },
        ],
      },
      { source: "/raport/:id", headers: [privateRouteHeaders, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Cross-Origin-Opener-Policy", value: googlePayCrossOriginOpenerPolicy }] },
      { source: "/en/report/:id", headers: [privateRouteHeaders, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Cross-Origin-Opener-Policy", value: googlePayCrossOriginOpenerPolicy }] },
      { source: "/en/analysis", headers: [privateRouteHeaders, { key: "Referrer-Policy", value: "no-referrer" }] },
      {
        source: "/en/report",
        headers: [
          privateRouteHeaders,
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cross-Origin-Opener-Policy", value: googlePayCrossOriginOpenerPolicy },
        ],
      },
    ];
  },
  async redirects() {
    const schoolsOrigin = schoolSiteOrigin();
    return [
      ...(schoolsOrigin ? [
        { source: "/dla-szkol", has: [{ type: "host" as const, value: "cvunfold.com" }], destination: `${schoolsOrigin}/`, permanent: true },
        { source: "/dla-szkol/:path+", has: [{ type: "host" as const, value: "cvunfold.com" }], destination: `${schoolsOrigin}/dla-szkol/:path+`, permanent: true },
        { source: "/en/for-schools/:path*", has: [{ type: "host" as const, value: "cvunfold.com" }], destination: `${schoolsOrigin}/en/for-schools/:path*`, permanent: true },
        { source: "/dla-szkol", has: [{ type: "host" as const, value: SCHOOL_HOST }], destination: `${schoolsOrigin}/`, permanent: true },
      ] : []),
      {
        source: "/:path*",
        has: [{ type: "host", value: "cvunfold.pl" }],
        destination: "https://cvunfold.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cvunfold.pl" }],
        destination: "https://cvunfold.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cvunfold.com" }],
        destination: "https://cvunfold.com/:path*",
        permanent: true,
      },
      { source: "/pl", destination: "/", permanent: true },
      { source: "/pl/analiza", destination: "/analiza", permanent: true },
      { source: "/pl/przykladowy-raport", destination: "/przykladowy-raport", permanent: true },
      { source: "/pl/artykuly", destination: "/artykuly", permanent: true },
      { source: "/pl/artykuly/:path*", destination: "/artykuly/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
