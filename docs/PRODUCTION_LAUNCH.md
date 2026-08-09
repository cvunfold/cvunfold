# Production launch checklist

## Product
- [ ] Happy path and all errors on desktop/mobile
- [ ] Demo report and Polish copy reviewed by owner
- [ ] Real PDF and DOCX samples pass

## AI
- [ ] Ten-fixture eval and injection suite pass
- [ ] Hallucination/evidence audit by an experienced Frontend Developer
- [ ] Cost limits and model names configured

## Payments
- [ ] Stripe live-mode business data and payout account verified by owner
- [ ] Prices, currency, descriptor and available payment methods match the UI
- [ ] Production webhook, success/failure, refund procedure and one real checkout tested

## Data and security
- [ ] Source deletion, user deletion and 30-day cleanup verified
- [ ] RLS, private bucket, headers, rate limit, dependency/secret scan verified
- [ ] Backup expectations documented; full report never leaks before paid check

## Legal
- [ ] Owner fills company/contact placeholders
- [ ] Accountant confirms tax/VAT and payment records
- [ ] Lawyer reviews privacy policy, terms, refund policy and digital-service consent

## Domain and analytics
- [ ] Owner approves domain purchase and production DNS separately
- [ ] SSL, canonical, sitemap, `/pl` redirects and `noindex` private routes verified
- [ ] Create a CVUnfold-owned GA4 property and Google Ads account; record account/property/stream ownership in `EXTERNAL_RESOURCES.md`
- [ ] Set `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION` and `GOOGLE_SITE_VERIFICATION` in Vercel Production
- [ ] Consent Mode v2 defaults to denied; accept/reject/withdraw flows and PII-free events verified in Tag Assistant
- [ ] Google Ads purchase conversion fires only after a server-verified paid Checkout Session; no CV/report/access-token data reaches analytics

The first production deployment, production DNS change, live Stripe activation and real payment require explicit owner approval.
