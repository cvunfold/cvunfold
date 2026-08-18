export const ATS_CHECK_IDS = [
  "text_layer",
  "reading_order",
  "sections",
  "dates_titles",
  "contact_info",
  "layout_columns",
  "glyph_artifacts",
  "date_format",
] as const;
export type AtsCheckId = (typeof ATS_CHECK_IDS)[number];

export type AtsCheckStatus = "pass" | "warning" | "fail" | "not_applicable";

export type AtsCheckItem = {
  id: AtsCheckId;
  status: AtsCheckStatus;
  /** Small, non-personal numbers behind the verdict (counts, ratios), for debugging and future copy tuning. Never CV content. */
  metrics?: Record<string, number>;
};

export type AtsCheckResult = {
  score: number;
  checks: AtsCheckItem[];
};

export type PdfTextItemPosition = { str: string; x: number; y: number; width: number };
export type PdfPageLayout = { items: PdfTextItemPosition[] };
