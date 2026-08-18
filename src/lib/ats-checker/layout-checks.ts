import type { AtsCheckItem, PdfPageLayout, PdfTextItemPosition } from "./types";

type Row = { y: number; x0: number; items: PdfTextItemPosition[] };

/** Groups items into visual rows in the order pdf.js extracted them — mirrors the one-line-per-y-value convention `document-parsing`'s own renderer already uses. */
function rowsForPage(page: PdfPageLayout, yTolerance = 1.5): Row[] {
  const rows: Row[] = [];
  for (const item of page.items) {
    const current = rows[rows.length - 1];
    if (current && Math.abs(current.y - item.y) <= yTolerance) {
      current.items.push(item);
      current.x0 = Math.min(current.x0, item.x);
    } else {
      rows.push({ y: item.y, x0: item.x, items: [item] });
    }
  }
  return rows;
}

// A gap this small is normal bullet/heading indentation within one column; a
// gap this large only occurs when a second column (or a wide table) starts
// roughly halfway across the page.
const COLUMN_BAND_GAP = 90;
const MIN_ROWS_FOR_BAND = 2;

function columnBands(x0Values: number[]): number {
  if (x0Values.length === 0) return 0;
  const sorted = [...x0Values].sort((a, b) => a - b);
  const bandSizes: number[] = [1];
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] - sorted[i - 1] <= COLUMN_BAND_GAP) bandSizes[bandSizes.length - 1] += 1;
    else bandSizes.push(1);
  }
  return bandSizes.filter((size) => size >= MIN_ROWS_FOR_BAND).length;
}

export function checkLayoutColumns(pages: PdfPageLayout[]): AtsCheckItem {
  const rows = pages.flatMap(rowsForPage);
  if (rows.length === 0) return { id: "layout_columns", status: "not_applicable" };
  const bands = columnBands(rows.map((row) => row.x0));
  const metrics = { rows: rows.length, column_bands: bands };
  return bands >= 2 ? { id: "layout_columns", status: "warning", metrics } : { id: "layout_columns", status: "pass", metrics };
}

// PDF y grows upward, so a well-ordered single flow has non-increasing y as
// extraction order advances. One backward jump per genuine column transition
// is expected and not a defect; anything beyond that is text pulled out of
// visual order (floating boxes, absolutely positioned elements).
const LINE_HEIGHT_CUSHION = 8;

export function checkReadingOrder(pages: PdfPageLayout[]): AtsCheckItem {
  const allRows = pages.flatMap(rowsForPage);
  if (allRows.length === 0) return { id: "reading_order", status: "not_applicable" };
  // Column bands are read from the whole document (a CV's layout is normally
  // consistent across its pages), but the inversion walk resets per page: a
  // new page starts a new coordinate space, so the jump back to the top of
  // page 2 is not a reading-order defect.
  const bands = columnBands(allRows.map((row) => row.x0));
  const inversionBudgetPerPage = Math.max(0, bands - 1);
  let inversions = 0;
  let rowCount = 0;
  for (const page of pages) {
    const rows = rowsForPage(page);
    if (rows.length === 0) continue;
    rowCount += rows.length;
    // Compares each row only to the one immediately before it, not to the
    // page's running minimum: after a genuine column jump, every row in the
    // new column would otherwise still read as "above" the old column's
    // lowest point and get double-counted as further inversions.
    let previousY = rows[0].y;
    for (const row of rows.slice(1)) {
      if (row.y > previousY + LINE_HEIGHT_CUSHION) inversions += 1;
      previousY = row.y;
    }
  }
  const inversionBudget = inversionBudgetPerPage * pages.length;
  const excess = Math.max(0, inversions - inversionBudget);
  const metrics = { rows: rowCount, inversions, inversion_budget: inversionBudget };
  if (excess === 0) return { id: "reading_order", status: "pass", metrics };
  if (excess <= 2) return { id: "reading_order", status: "warning", metrics };
  return { id: "reading_order", status: "fail", metrics };
}
