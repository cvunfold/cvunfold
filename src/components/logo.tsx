import Link from "next/link";
import { brand } from "@/lib/brand";
import { homePath, type Locale } from "@/lib/i18n";

export function Logo({ locale = "pl" }: { locale?: Locale }) {
  const label = locale === "pl" ? "strona główna" : "home";
  return <Link className="logo" href={homePath(locale)} aria-label={`${brand.name} — ${label}`}>
    <span>{brand.wordmarkPrefix}</span><b>{brand.wordmarkAccent}</b>
  </Link>;
}
