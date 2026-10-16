// Bind mutations to the visible report when another tab changes the shared cookie.
export function reportRequestHeaders(extra: Record<string, string> = {}): Record<string, string> {
  if (typeof window === "undefined") return extra;
  const id = window.location.pathname.match(/^\/(?:raport|en\/report)\/([a-f0-9-]{36})$/i)?.[1];
  return id ? { ...extra, "X-Report-ID": id } : extra;
}
