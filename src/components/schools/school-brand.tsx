import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { brand } from "@/lib/brand";
import { BrandMark, BrandWordmark } from "@/components/brand-mark";

import { schoolsPath, type Locale } from "@/lib/i18n";

export function SchoolBrand({ locale = "pl" }: { locale?: Locale }) {
  return <Link className="school-brand" href={schoolsPath(locale)} aria-label={locale === "pl" ? `${brand.name} dla szkół IT, strona główna dla szkół` : `${brand.name} for IT schools, schools home`}>
    <span className="logo school-brand-wordmark"><BrandMark/><BrandWordmark/></span>
    <span className="school-brand-audience"><GraduationCap className="school-brand-cap" strokeWidth={1.7} aria-hidden="true"/><span>{locale === "pl" ? "Dla szkół" : "For schools"} <i>IT</i></span></span>
  </Link>;
}
