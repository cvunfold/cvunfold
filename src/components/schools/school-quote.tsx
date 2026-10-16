import type { ReactNode } from "react";
import { Quote } from "lucide-react";
import { SchoolFormattedText } from "./formatted-text";
export function SchoolQuote({ children, formatted = false }: { children: ReactNode; formatted?: boolean }) {
  return <blockquote><Quote className="school-quote-icon" size={21} strokeWidth={1.7} aria-hidden="true"/>{formatted && typeof children === "string" ? <SchoolFormattedText text={children}/> : children}</blockquote>;
}
