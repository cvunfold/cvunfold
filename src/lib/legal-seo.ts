import type { Metadata } from "next";
import { publicSocialMetadata } from "@/lib/public-page-metadata";

type LegalKind = "terms" | "privacy" | "cookies" | "delete" | "contact";

const paths = {
  terms: ["/regulamin", "/en/terms"],
  privacy: ["/polityka-prywatnosci", "/en/privacy"],
  cookies: ["/cookies", "/en/cookies"],
  delete: ["/usun-dane", "/en/delete-data"],
  contact: ["/kontakt", "/en/contact"],
} as const;

const copy = {
  pl: {
    terms: ["Regulamin", "Zasady korzystania z usługi analizy CV CV Unfold."],
    privacy: ["Polityka prywatności", "Jak CV Unfold przetwarza i chroni dane przesyłane do analizy CV."],
    cookies: ["Polityka cookies", "Informacje o plikach cookies i ustawieniach zgód w CV Unfold."],
    delete: ["Usuwanie danych", "Jak natychmiast usunąć raport i dane analizy CV Unfold."],
    contact: ["Kontakt", "Dane kontaktowe i informacje o operatorze CV Unfold."],
  },
  en: {
    terms: ["Terms of service", "Terms governing the CV Unfold CV review service."],
    privacy: ["Privacy policy", "How CV Unfold processes and protects data submitted for a CV review."],
    cookies: ["Cookie policy", "Information about cookies and consent settings in CV Unfold."],
    delete: ["Delete your data", "How to delete a CV Unfold report and analysis data immediately."],
    contact: ["Contact", "Contact details and information about the operator of CV Unfold."],
  },
} as const;

export function legalMetadata(locale: "pl" | "en", kind: LegalKind): Metadata {
  const [plPath, enPath] = paths[kind];
  const [title, description] = copy[locale][kind];
  return {
    ...publicSocialMetadata(locale, { title, description, path: locale === "pl" ? plPath : enPath }),
    title,
    description,
    alternates: {
      canonical: locale === "pl" ? plPath : enPath,
      languages: { "pl-PL": plPath, en: enPath, "x-default": plPath },
    },
  };
}
