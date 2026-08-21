import { ImageResponse } from "next/og";
import { OgImageCanvas } from "@/lib/og-image";
import { ogFonts } from "@/lib/og-font";
import { brand } from "@/lib/brand";

export const alt = `${brand.name} — evidence-based developer CV review`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function EnglishOpenGraphImage() {
  return new ImageResponse(<OgImageCanvas
    title="Usually it's a few sentences missing, not more experience."
    description="See how your responsibility, impact and technical credibility come across to a hiring manager."
    label="EVIDENCE-BASED CV REVIEW"
    footer="First impression · Evidence · Impact · Priorities"
  />, { ...size, fonts: await ogFonts() });
}
