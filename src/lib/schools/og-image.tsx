import pairs from "../../../fixtures/schools/guided-iterations.json";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";

export function SchoolOgImage({ locale }: { locale: Locale }) {
  const pl = locale === "pl";
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "48px 56px", background: "#f0f3e9", color: "#07162f", fontFamily: "Gidole" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 30 }}>
      <span style={{ fontWeight: 700 }}>{brand.name}</span><span style={{ color: "#526326" }}>{pl ? "Dla szkół IT" : "For IT schools"}</span>
    </div>
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
        <div style={{ fontSize: 56, lineHeight: 1.08, fontWeight: 700 }}>{pl ? "Lepsze CV. Cała grupa pod Twoją opieką." : "Better CVs. Your whole group in your care."}</div>
        <div style={{ marginTop: 26, fontSize: 24, lineHeight: 1.4, color: "#46536b" }}>{pl ? "Indywidualne raporty i wspólne obszary do pracy na warsztacie." : "Individual reports and shared priorities for your next workshop."}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 430, padding: 28, borderRadius: 20, background: "#07162f", color: "#fff" }}>
        <div style={{ fontSize: 27, fontWeight: 700, marginBottom: 20 }}>{pl ? `Frontend · ${pairs.length} CV` : `Frontend · ${pairs.length} CVs`}</div>
        {pairs.slice(0, 3).map(pair => ({ name: pair.name.split(" ")[0], before: pair.before.report.summary.overallScore, after: pair.after.report.summary.overallScore })).map(({ name, before, after }) => <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "14px 18px", borderRadius: 9, background: "#fff", color: "#07162f", fontSize: 23 }}><span>{name}</span><span style={{ fontWeight: 700 }}>{before} → {after}/100</span></div>)}
        <div style={{ marginTop: 12, color: "#d4e5a0", fontSize: 17 }}>{pl ? "Demo na fikcyjnych CV" : "Demo with fictional CVs"}</div>
      </div>
    </div>
    <div style={{ display: "flex", fontSize: 19, color: "#526326" }}>{pl ? "Zobacz demo i porozmawiajmy o pilotażu" : "Explore the demo and discuss a pilot"}</div>
  </div>;
}
