import { randomUUID } from "node:crypto";

// No automatic .env loading: credentials and the target must be supplied explicitly.
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("school-access: --action inspect|activate|revoke --school-id UUID --base-url URL --environment development|preview|production --database-ref REF [--invoice NUMBER --until ISO_DATETIME] [--request-id UUID] [--apply]");
  console.log("Reads ADMIN_SECRET from the environment. Without --apply, activate/revoke only show the intended change. This tool does not issue or send an invoice.");
  process.exit(0);
}
const options = {};
for (let i = 0; i < args.length; i++) {
  const key = args[i];
  if (key === "--apply") { options.apply = true; continue; }
  if (!["--action", "--school-id", "--base-url", "--environment", "--database-ref", "--invoice", "--until", "--request-id"].includes(key) || !args[i + 1] || args[i + 1].startsWith("--")) throw new Error("Unknown or incomplete option. Use --help.");
  if (Object.hasOwn(options, key.slice(2))) throw new Error("Duplicate option.");
  options[key.slice(2)] = args[++i];
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const action = options.action || "inspect";
if (!["inspect", "activate", "revoke"].includes(action) || !uuid.test(options["school-id"] || "")) throw new Error("Specify action and school UUID.");
if (!["development", "preview", "production"].includes(options.environment) || !/^[a-z0-9]{20}$/.test(options["database-ref"] || "")) throw new Error("Explicit expected environment and Supabase database ref are required.");
const url = new URL(options["base-url"] || "");
if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("Use a base origin without credentials or a path.");
const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
if (options.environment === "development" ? !local || url.protocol !== "http:" : local || url.protocol !== "https:") throw new Error("URL does not match the selected environment.");
if (!local && process.env.SCHOOL_ACCESS_ALLOWED_ORIGIN !== url.origin) throw new Error("Set SCHOOL_ACCESS_ALLOWED_ORIGIN to the independently verified CVUnfold origin before sending the owner credential remotely.");
const requestId = options["request-id"] || randomUUID();
if (!uuid.test(requestId)) throw new Error("Request ID must be a UUID.");
const payload = { action, schoolId: options["school-id"], requestId };
if (action === "activate") {
  if (!options.invoice?.trim() || options.invoice.trim().length > 120 || !options.until || !Number.isFinite(Date.parse(options.until)) || Date.parse(options.until) <= Date.now() || !/(Z|[+-]\d\d:\d\d)$/.test(options.until)) throw new Error("Activation requires an invoice reference and a future ISO expiry with timezone.");
  Object.assign(payload, { invoiceReference: options.invoice.trim(), expiresAt: new Date(options.until).toISOString() });
} else if (options.invoice || options.until) throw new Error("Invoice and expiry apply only to activation.");
const secret = process.env.ADMIN_SECRET;
if (!secret || secret.length < 32) throw new Error("Set a server ADMIN_SECRET of at least 32 characters in the environment.");
const endpoint = new URL("/api/admin/schools/access", url);
const headers = { authorization: `Bearer ${secret}`, "content-type": "application/json", "x-cvunfold-environment": options.environment, "x-cvunfold-database-ref": options["database-ref"] };
async function call(target, init) {
  const response = await fetch(target, { ...init, headers, redirect: "error", signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed: ${response.status}`);
  if (result.environment !== options.environment || result.databaseRef !== options["database-ref"]) throw new Error("Environment/database mismatch. No write should be attempted.");
  return result;
}
endpoint.searchParams.set("schoolId", options["school-id"]);
const current = await call(endpoint, { method: "GET" });
console.log(JSON.stringify({ environment: current.environment, databaseRef: current.databaseRef, school: current.school, active: current.active, access: current.access }, null, 2));
if (action !== "inspect") {
  console.log(JSON.stringify({ intendedChange: payload, apply: Boolean(options.apply) }, null, 2));
  if (options.apply) {
    endpoint.search = "";
    const changed = await call(endpoint, { method: "POST", body: JSON.stringify(payload) });
    console.log(JSON.stringify({ active: changed.active, replayed: changed.replayed, access: changed.access }, null, 2));
  }
}
