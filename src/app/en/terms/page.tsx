import { legalMetadata } from "@/lib/legal-seo";
import { LegalPage } from "@/components/legal-page";
export const metadata=legalMetadata("en","terms");
export default function Page(){return <LegalPage locale="en" kind="terms"/>;}
