import { brand } from "@/lib/brand";

export function BrandMark() {
  return <svg className="brand-mark" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
    <path className="brand-mark-page" d="M5 20c0-2.3 1-3.8 3.4-4.8L45 1.5c2.2-.9 3.7.1 3.7 2.5v43.5c0 11.7 5.3 18 15.4 21.2-4.7 1.5-8.2 1.7-13 .5L9.2 58.8C6.4 58.1 5 56.6 5 54Z"/>
    <path className="brand-mark-fold" d="m57.2 20.5 11.2-4.4c2-.8 3.1.1 3.1 2.2v33.1c0 8.4-3.4 14.5-10.8 17.7-8.2-2.3-11-8.1-11-18.8V28.5c0-4.2 2.1-6.2 7.5-8Z"/>
  </svg>;
}

export function BrandWordmark() {
  return <span className="brand-wordmark">{brand.wordmarkPrefix}{brand.wordmarkAccent}</span>;
}
