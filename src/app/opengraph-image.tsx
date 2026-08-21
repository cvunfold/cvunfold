import { ImageResponse } from "next/og";
import { OgImageCanvas } from "@/lib/og-image";
import { brand } from "@/lib/brand";
import { ogFonts } from "@/lib/og-font";

export const alt = `${brand.name} — analiza CV developera`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(<OgImageCanvas
    title="Zwykle brakuje kilku zdań, nie nowego doświadczenia."
    description="Zobacz, jak rekruter może odczytać Twój poziom, ownership, wpływ i techniczną wiarygodność."
  />, { ...size, fonts: await ogFonts() });
}
