import type { NextConfig } from "next";

const googleAnalyticsEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
const googleScriptSources = googleAnalyticsEnabled ? " https://www.googletagmanager.com" : "";
const googleConnectSources = googleAnalyticsEnabled
  ? " https://www.google-analytics.com https://*.google-analytics.com https://www.google.com https://www.google.pl https://www.googleadservices.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net"
  : "";
const googleImageSources = googleAnalyticsEnabled
  ? " https://www.google-analytics.com https://www.google.com https://www.google.pl https://www.googleadservices.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net"
  : "";
const scriptPolicy = process.env.NODE_ENV === "development"
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'${googleScriptSources}`
  : `script-src 'self' 'unsafe-inline'${googleScriptSources}`;
const csp = [
  "default-src 'self'",
  scriptPolicy,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${googleImageSources}`,
  "font-src 'self'",
  `connect-src 'self'${googleConnectSources}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
  async headers() {
    const privateRouteHeaders = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" };
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
      { source: "/api/:path*", headers: [privateRouteHeaders] },
      { source: "/pl/analiza", headers: [privateRouteHeaders] },
      { source: "/pl/raport/:path*", headers: [privateRouteHeaders] },
    ];
  },
  async redirects() {
    return [{ source: "/", destination: "/pl", permanent: true }];
  },
};

export default nextConfig;
