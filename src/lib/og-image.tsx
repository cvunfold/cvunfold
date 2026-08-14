import { brand } from "@/lib/brand";

type OgImageCanvasProps = {
  title: string;
  description: string;
  label?: string;
  footer?: string;
};

export function OgImageCanvas({ title, description, label = "ANALIZA CV OCZAMI REKRUTERA", footer = "Pierwsze wrażenie · Dowody · Wpływ · Priorytety" }: OgImageCanvasProps) {
  const titleSize = title.length > 70 ? 55 : title.length > 48 ? 63 : 72;
  return <div style={{
    width: "100%", height: "100%", position: "relative", display: "flex", overflow: "hidden",
    background: "#07162f", color: "#ffffff", fontFamily: "Gidole",
  }}>
    <div style={{ width: 18, height: "100%", background: "#b9da00" }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 70px 48px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 32, fontWeight: 800, letterSpacing: -1.5 }}>
          {brand.name}<span style={{ color: "#b9da00" }}>.</span>
        </div>
        <div style={{ color: "#b9da00", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{new URL(brand.siteUrl).hostname.toUpperCase()}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 940 }}>
        <div style={{ marginBottom: 22, color: "#b9da00", fontSize: 15, fontWeight: 800, letterSpacing: 2.1 }}>{label}</div>
        <div style={{ maxWidth: 950, fontSize: titleSize, fontWeight: 700, lineHeight: 1.03, letterSpacing: -2.8 }}>{title}</div>
        <div style={{ width: 82, height: 4, margin: "28px 0 22px", background: "#b9da00" }} />
        <div style={{ maxWidth: 900, color: "rgba(255,255,255,.74)", fontSize: 23, lineHeight: 1.42 }}>{description}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,.48)", fontSize: 15, letterSpacing: .4 }}>
        {footer}
      </div>
    </div>
    <div style={{
      width: 360, height: 360, position: "absolute", right: -115, bottom: -125, display: "flex",
      alignItems: "center", justifyContent: "center", border: "2px solid rgba(185,218,0,.22)", borderRadius: 999,
      color: "rgba(185,218,0,.15)", fontSize: 170, fontWeight: 800, letterSpacing: -12,
    }}>{brand.monogram}</div>
  </div>;
}
