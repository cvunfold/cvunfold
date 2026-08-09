import { ImageResponse } from "next/og";
import { articlesEnBySlug } from "@/lib/content/articles-en";
import { OgImageCanvas } from "@/lib/og-image";
import { ogFonts } from "@/lib/og-font";

export const alt = "Developer CV and career article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articlesEnBySlug.get((await params).slug);
  return new ImageResponse(<OgImageCanvas
    title={article?.title || "Practical knowledge for developers"}
    description={article?.excerpt || "Practical guidance on CVs, hiring and developer career growth."}
    label={article?.category.toLocaleUpperCase("en-GB") || "INSIGHTS"}
    footer="Seniority · Ownership · Impact · Credibility"
  />, { ...size, fonts: await ogFonts() });
}

