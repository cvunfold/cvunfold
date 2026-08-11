type ContentSecurityPolicyOptions = {
  googleEnabled: boolean;
  turnstileEnabled: boolean;
  development: boolean;
};

const googleSources = {
  script: [
    "https://www.googletagmanager.com",
    "https://www.googleadservices.com",
    "https://www.google.com",
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
  ],
  image: [
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://www.google.pl",
    "https://google.com",
    "https://google.pl",
    "https://pagead2.googlesyndication.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
  ],
  connect: [
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://www.google.pl",
    "https://google.com",
    "https://google.pl",
    "https://pagead2.googlesyndication.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://ad.doubleclick.net",
  ],
  frame: ["https://www.googletagmanager.com"],
} as const;

function directive(name: string, sources: readonly string[]) {
  return `${name} ${sources.join(" ")}`;
}

export function buildContentSecurityPolicy({ googleEnabled, turnstileEnabled, development }: ContentSecurityPolicyOptions) {
  const google = <Key extends keyof typeof googleSources>(key: Key) => googleEnabled ? googleSources[key] : [];
  const turnstile = turnstileEnabled ? ["https://challenges.cloudflare.com"] : [];

  return [
    "default-src 'self'",
    directive("script-src", ["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : []), ...google("script"), ...turnstile]),
    "style-src 'self' 'unsafe-inline'",
    directive("img-src", ["'self'", "data:", "blob:", ...google("image")]),
    "font-src 'self'",
    directive("connect-src", ["'self'", ...google("connect"), ...turnstile]),
    directive("frame-src", ["'self'", ...google("frame"), ...turnstile]),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");
}
