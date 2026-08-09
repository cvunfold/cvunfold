import { ImageResponse } from "next/og";
import { articlesBySlug } from "@/lib/content/articles";
import { OgImageCanvas } from "@/lib/og-image";
import { ogFonts } from "@/lib/og-font";

export const alt = "Artykuł o CV i karierze developera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articlesBySlug.get((await params).slug);
  return new ImageResponse(<OgImageCanvas
    title={article?.title || "Wiedza dla developerów"}
    description={article?.excerpt || "Praktycznie o CV, rekrutacji i rozwoju kariery developera."}
    label={article?.category.toLocaleUpperCase("pl-PL") || "WIEDZA"}
  />, { ...size, fonts: await ogFonts() });
}

