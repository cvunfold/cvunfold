import { legalMetadata } from "@/lib/legal-seo";
import { LegalPage } from "@/components/legal-page";
export const metadata=legalMetadata("pl","contact");
export default function Page(){return <LegalPage locale="pl" kind="contact"/>;}
