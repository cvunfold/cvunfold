// Only the two public offers are measurable. Every school sub-route stays private.
export function isSchoolOffer(pathname: string): boolean {
  return pathname === "/dla-szkol" || pathname === "/en/for-schools";
}

export function isPrivateSchoolPage(pathname: string): boolean {
  return !isSchoolOffer(pathname) && (pathname.startsWith("/dla-szkol/") || pathname.startsWith("/en/for-schools/"));
}
