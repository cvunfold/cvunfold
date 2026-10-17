import { ImageResponse } from "next/og";
import { SchoolOgImage } from "@/lib/schools/og-image";
import { ogFonts } from "@/lib/og-font";

export const alt = "CVUnfold for IT schools: CV reports and workshop priorities for a fictional group";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(<SchoolOgImage locale="en"/>, { ...size, fonts: await ogFonts() });
}
