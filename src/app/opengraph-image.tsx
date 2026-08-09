import { ImageResponse } from "next/og";
import { OgImageCanvas } from "@/lib/og-image";

export const alt = "CVUnfold — analiza CV oczami rekrutera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<OgImageCanvas
    title="Masz doświadczenie. Czy widać je w Twoim CV?"
    description="Zobacz, jak rekruter może odczytać Twój poziom, ownership, wpływ i techniczną wiarygodność."
  />, size);
}
