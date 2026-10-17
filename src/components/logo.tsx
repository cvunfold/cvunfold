import Link from "next/link";
import { brand } from "@/lib/brand";
import { homePath, type Locale } from "@/lib/i18n";
import { BrandMark, BrandWordmark } from "@/components/brand-mark";

export function Logo({ locale = "pl" }: { locale?: Locale }) {
  const label = locale === "pl" ? "strona główna" : "home";
  return <Link className="logo" href={homePath(locale)} aria-label={`${brand.name}, ${label}`}>
    <BrandMark/><BrandWordmark/>
  </Link>;
}
