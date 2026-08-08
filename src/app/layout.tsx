import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CVUnfold — merytoryczna analiza CV", template: "%s · CVUnfold" },
  description: "Sprawdź, czy w Twoim CV widać seniority, ownership, wpływ i techniczną wiarygodność.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
