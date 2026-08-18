// Reads the server-side funnel from /api/admin/diagnostics and prints it.
// These counts come from funnel_events, which is written on the server and does not
// depend on analytics consent, so they cover visitors GA4 never sees.
//
//   ADMIN_SECRET=… node scripts/funnel-report.mjs --days 7 --environment production
//   FUNNEL_BASE_URL=https://cvunfold.com ADMIN_SECRET=… node scripts/funnel-report.mjs

const baseURL = (process.env.FUNNEL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.ADMIN_SECRET;
const daysArgument = process.argv.includes("--days") ? process.argv[process.argv.indexOf("--days") + 1] : "7";
const days = Number(daysArgument);
const environmentArgument = process.argv.includes("--environment") ? process.argv[process.argv.indexOf("--environment") + 1] : "production";
const runtimeEnvironments = new Set(["production", "preview", "development", "legacy_unknown"]);

if (!secret) {
  console.error("Set ADMIN_SECRET (the value from your deployment environment) before running this.");
  process.exit(1);
}
if (!Number.isInteger(days) || days < 1 || days > 90) {
  console.error(`--days must be a whole number between 1 and 90, received "${daysArgument}".`);
  process.exit(1);
}
if (!runtimeEnvironments.has(environmentArgument)) {
  console.error(`--environment must be one of ${[...runtimeEnvironments].join(", ")}, received "${environmentArgument}".`);
  process.exit(1);
}

const response = await fetch(`${baseURL}/api/admin/diagnostics?days=${days}&environment=${encodeURIComponent(environmentArgument)}`, {
  headers: { authorization: `Bearer ${secret}` },
});
if (!response.ok) {
  console.error(`${baseURL} answered ${response.status}. A 401 means ADMIN_SECRET does not match this environment.`);
  process.exit(1);
}
const report = await response.json();
const events = report.events || {};
const rates = report.conversionRatesPercent || {};

// Without Supabase the app answers from an in-memory store that resets with the process,
// so zeros there mean "no database", not "no traffic". Say so instead of printing a wall of zeros.
if (!report.trafficMix) {
  console.error(`\n${baseURL} has no Supabase configured — it answered from its in-memory store,`);
  console.error("which only holds events since the last restart. Point FUNNEL_BASE_URL at the");
  console.error("deployment that talks to the database.\n");
  process.exit(2);
}

const number = (value) => String(value ?? 0).padStart(6);
const percent = (value) => value === null || value === undefined ? "     —" : `${String(value).padStart(5)}%`;
const heading = (text) => `\n${text}\n${"─".repeat(text.length)}`;
const table = (entries, emptyNote) => {
  const rows = Object.entries(entries || {}).sort((left, right) => right[1] - left[1]);
  if (!rows.length) return `  ${emptyNote}`;
  const width = Math.max(...rows.map(([label]) => label.length));
  return rows.map(([label, value]) => `  ${label.padEnd(width)}  ${number(value)}`).join("\n");
};

console.log(`\nCV Unfold — funnel from the server, last ${report.windowDays ?? days} day(s)`);
console.log(`Source: ${baseURL}/api/admin/diagnostics · ${report.runtimeEnvironment || environmentArgument} only · consent-independent`);

console.log(heading("Funnel"));
for (const [label, name] of [
  ["Analysis started   ", "analysis_started"],
  ["Analysis succeeded ", "analysis_succeeded"],
  ["Analysis failed    ", "analysis_failed"],
  ["Teaser viewed      ", "teaser_viewed"],
  ["Checkout started   ", "checkout_started"],
  ["Checkout cancelled ", "checkout_cancelled"],
  ["Purchase           ", "purchase"],
  ["Full report viewed ", "full_report_viewed"],
]) {
  console.log(`  ${label}${number(events[name])}`);
}

console.log(heading("Conversion"));
console.log(`  Analysis success   ${percent(rates.analysisSuccess)}`);
console.log(`  Teaser → checkout  ${percent(rates.teaserToCheckout)}`);
console.log(`  Checkout → paid    ${percent(rates.checkoutToPurchase)}`);

console.log(heading("Where the traffic came from (medium)"));
console.log(table(report.trafficMix?.byMedium, "no analysis_started events in this window"));

console.log(heading("Where the traffic came from (source)"));
console.log(table(report.trafficMix?.bySource, "no analysis_started events in this window"));

// A Google Ads click without utm_medium=cpc lands in "(direct)" above. This is how many of
// those direct-looking visits actually carried an ad click ID (gclid/gbraid/wbraid).
console.log(`\n  Of which had an ad click ID but no UTM tag: ${number(report.trafficMix?.paidClicks)}`);

console.log(heading("Failed analyses by cause"));
console.log(table(report.topErrorCategories, "none"));

console.log(heading("Money"));
console.log(`  Paid purchases     ${number(report.purchases)}`);
for (const [currency, amount] of Object.entries(report.revenueByCurrency || {})) {
  console.log(`  Revenue ${currency.toUpperCase().padEnd(10)} ${number(amount)}`);
}
console.log(`  Estimated AI cost  ${number(Math.round((report.aiCost || 0) * 100) / 100)}`);

console.log(`\nGA4 sees only visitors who accepted analytics cookies. Comparing "Analysis started" here`);
console.log(`with upload_started in GA4 gives you the consent rate.\n`);
