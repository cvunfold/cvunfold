/** Public metadata must never inherit a local application/callback URL. */
export function resolvePublicSiteUrl(value?: string): string {
  const configured = value?.trim() || "https://cvunfold.com";
  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("PUBLIC_SITE_URL_INVALID"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.port
    || url.pathname !== "/" || url.search || url.hash
    || !host.includes(".") || host.endsWith(".localhost") || host.endsWith(".local")
    || /^[\d.]+$/.test(host) || host.includes(":")) throw new Error("PUBLIC_SITE_URL_INVALID");
  return url.origin;
}
