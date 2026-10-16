import type { Metadata } from "next";
import "./schools.css";
import "./school-workspace.css";

export const metadata: Metadata = {
  title: "Panel dla szkół IT",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noimageindex: true },
};
export default function SchoolsLayout({ children }: { children: React.ReactNode }) { return children; }
