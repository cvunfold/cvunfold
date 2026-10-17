// A conservative regression alarm for the known synthetic manual-category
// ambiguity. It does not replace semantic/manual factual review.
export function hasAffirmativeManualRoutingClaim(text: string): boolean {
  return text.split(/[.!?]\s+/).some(sentence => {
    const routing = /(?:skierowa|kierowani|kierowanie|przekierowa|routed|routing|manual.review path|human fallback|ręczn[aą] ścieżk)/i.test(sentence);
    const uncertainty = /(?:\b(?:not|no|never|without|cannot|whether|unclear)\b|doesn't|\bnie\b|\bbrak\b|\bczy\b)/i.test(sentence);
    return routing && !uncertainty;
  });
}
