import { legalMetadata } from "@/lib/legal-seo";
import { LegalPage } from "@/components/legal-page";
export const metadata=legalMetadata("en","delete");
export default function Page(){return <LegalPage locale="en" kind="delete"/>;}
