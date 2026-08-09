"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ siteKey, locale, onToken }: { siteKey?: string; locale: Locale; onToken: (token: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !root.current) return;
    let widgetId = "";
    let cancelled = false;
    const render = () => {
      if (cancelled || !root.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(root.current, {
        sitekey: siteKey,
        language: locale,
        theme: "light",
        size: "flexible",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-product-turnstile="true"]');
    if (existing) {
      if (window.turnstile) render(); else existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.productTurnstile = "true";
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }
    return () => { cancelled = true; if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [locale, onToken, siteKey]);
  if (!siteKey) return null;
  return <div className="turnstile-shell"><span>{locale === "pl" ? "Ochrona przed automatycznymi nadużyciami" : "Protection against automated abuse"}</span><div ref={root}/></div>;
}
