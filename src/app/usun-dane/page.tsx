import { legalMetadata } from "@/lib/legal-seo";
import { LegalPage } from "@/components/legal-page";
export const metadata=legalMetadata("pl","delete");
export default function Page(){return <LegalPage locale="pl" kind="delete"/>;}
