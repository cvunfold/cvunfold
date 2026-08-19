type ContentSecurityPolicyOptions = {
  googleEnabled: boolean;
  stripeEnabled: boolean;
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

// Stripe renders the Express Checkout Element in its own frame, but the wallets
// inside it are served by Google and Apple: the Google Pay script and sheet come
// from pay.google.com, Apple Pay's from applepay.cdn-apple.com. Without these the
// element loads, reports no available payment method and silently hides itself,
// which is indistinguishable from a device that genuinely has no wallet.
const stripeSources = {
  script: ["https://checkout.stripe.com", "https://js.stripe.com", "https://*.js.stripe.com", "https://pay.google.com", "https://applepay.cdn-apple.com"],
  image: ["https://*.stripe.com", "https://pay.google.com", "https://applepay.cdn-apple.com"],
  connect: ["https://checkout.stripe.com", "https://api.stripe.com", "https://pay.google.com", "https://applepay.cdn-apple.com"],
  frame: ["https://checkout.stripe.com", "https://js.stripe.com", "https://*.js.stripe.com", "https://hooks.stripe.com", "https://pay.google.com", "https://applepay.cdn-apple.com"],
} as const;

function directive(name: string, sources: readonly string[]) {
  return `${name} ${sources.join(" ")}`;
}

export function buildContentSecurityPolicy({ googleEnabled, stripeEnabled, turnstileEnabled, development }: ContentSecurityPolicyOptions) {
  const google = <Key extends keyof typeof googleSources>(key: Key) => googleEnabled ? googleSources[key] : [];
  const stripe = <Key extends keyof typeof stripeSources>(key: Key) => stripeEnabled ? stripeSources[key] : [];
  const turnstile = turnstileEnabled ? ["https://challenges.cloudflare.com"] : [];

  return [
    "default-src 'self'",
    directive("script-src", ["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : []), ...google("script"), ...stripe("script"), ...turnstile]),
    "style-src 'self' 'unsafe-inline'",
    directive("img-src", ["'self'", "data:", "blob:", ...google("image"), ...stripe("image")]),
    "font-src 'self'",
    directive("connect-src", ["'self'", ...google("connect"), ...stripe("connect"), ...turnstile]),
    directive("frame-src", ["'self'", ...google("frame"), ...stripe("frame"), ...turnstile]),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");
}
