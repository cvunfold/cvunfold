import robots from "../robots";
export const dynamic = "force-static";
export function GET() {
  const data = robots();
  const rule = Array.isArray(data.rules) ? data.rules[0] : data.rules;
  const blocked = typeof rule.disallow === "string" ? [rule.disallow] : rule.disallow || [];
  const text = ["User-agent: *", "Allow: /", ...blocked.map(path => `Disallow: ${path}`), `Sitemap: ${data.sitemap}`, `Host: ${data.host}`, ""].join("\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
