import { legalMetadata } from "@/lib/legal-seo";
import { LegalPage } from "@/components/legal-page";
export const metadata=legalMetadata("en","contact");
export default function Page(){return <LegalPage locale="en" kind="contact"/>;}
