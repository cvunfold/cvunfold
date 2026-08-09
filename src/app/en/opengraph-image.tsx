import { ImageResponse } from "next/og";
import { OgImageCanvas } from "@/lib/og-image";
import { ogFonts } from "@/lib/og-font";
import { brand } from "@/lib/brand";

export const alt = `${brand.name} — evidence-based developer CV review`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function EnglishOpenGraphImage() {
  return new ImageResponse(<OgImageCanvas
    title="You have experience. Does your CV show it?"
    description="See how your seniority, ownership, impact and technical credibility come across to a hiring manager."
    label="EVIDENCE-BASED CV REVIEW"
    footer="Seniority · Ownership · Impact · Credibility"
  />, { ...size, fonts: await ogFonts() });
}

