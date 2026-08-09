import { ImageResponse } from "next/og";
import { articlesBySlug } from "@/lib/content/articles";
import { OgImageCanvas } from "@/lib/og-image";
import { ogFonts } from "@/lib/og-font";

export const alt = "Artykuł CVUnfold o CV i karierze w branży tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articlesBySlug.get(slug);
  return new ImageResponse(<OgImageCanvas
    title={article?.title || "Wiedza CVUnfold"}
    description={article?.excerpt || "Praktycznie o CV, rekrutacji i budowaniu odporniejszej kariery w branży technologicznej."}
    label={article?.category.toLocaleUpperCase("pl-PL") || "WIEDZA CVUNFOLD"}
  />, { ...size, fonts: await ogFonts() });
}
