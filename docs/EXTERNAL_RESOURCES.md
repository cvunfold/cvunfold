# CVUnfold external resource registry

Last verified: 2026-08-14 (Europe/Warsaw).

This registry is the preflight source of truth for external writes. A shared
email address is not an ownership signal. NeoPadel and all other client or
employer resources remain forbidden.

| Service | Account | Organization / team | Project | Environment | Write status |
| --- | --- | --- | --- | --- | --- |
| GitHub | `pawelmaczkaczarnecki` | `cvunfold` | `cvunfold` | `main` | Approved for CVUnfold bootstrap |
| Supabase | private business account | `CVUnfold` | `cvunfold-prod` (`yttktyctjbciyqjpvunv`) linked to `cvunfold/cvunfold` and Vercel `cvunfold` | `main` / Production | Approved; schema active, private `cv-uploads` bucket active, Vercel variables synced, GitHub App restricted to the single CVUnfold repository |
| Stripe | private business account | `CV Unfold sandbox` (`acct_1U25LrB1aVOAs9bf`) | `CVUnfold – Pełna analiza CV` (`prod_V2BcQKq8kms0IC`), PLN `price_1U27EsB1aVOAs9bfWvS2A6Ky`, EUR `price_1U2aENB1aVOAs9bfyFJAnLun`; `CVUnfold – Analiza CV + dopasowanie do oferty` (`prod_V2CiPkJ0oUNwPa`), PLN `price_1U28JOB1aVOAs9bf0ffpvCfJ`, EUR `price_1U2aETB1aVOAs9bfM3AKzo2X`; webhook `we_1U27FWB1aVOAs9bfLI9ACfQB` | Test | Approved for test-only writes; active one-time prices 29/39 PLN and 9/12 EUR; webhook target `cvunfold.vercel.app/api/stripe/webhook` handles completed, async success/failure, expired and refunded; sandbox variables are scoped to Vercel Preview only |
| Google Analytics | private business Google account | `CV Unfold` | GA4 property `CVUnfold Production`, web stream `15406547205`, Measurement ID `G-D8TP3LQSJD` | Production data stream for `https://cvunfold.com` | Funnel and purchase adapter are deployed; GA4 confirmed incoming traffic and the stream URL was updated to `.com` on 2026-08-10 |
| Stripe | private business account | `CV Unfold` (`acct_1U25LlPlwW2w7lmM`) | `CVUnfold – Pełna analiza CV` (`prod_V2BR1jkm290WY2`), gross price `price_1U274aPlwW2w7lmMeYmto9uN`; `CVUnfold – Analiza CV + dopasowanie do oferty` (`prod_V2Z7k6UZaf1COq`), gross price `price_1U2Uc4PlwW2w7lmMocibPPMF`; webhook `we_1U2U1jPlwW2w7lmMUyDycEws` | Live / Production | Verified CVUnfold-owned; active one-time 29/39 PLN gross products and production webhook for paid Checkout events. Production uses live Stripe credentials; live Checkout Sessions for both prices were verified without completing a charge. Superseded net 39 PLN price `price_1U2Tz2PlwW2w7lmMsEivVqs6` is archived |
| OVHcloud | `xl5829-ovh` (`Paweł Mączka-Czarnecki IT`) | private business account | `cvunfold.pl`, `cvunfold.com` | Public DNS and mail forwarding / Production | Approved; apex and `www` point to Vercel (`216.150.1.1`); `support@cvunfold.com` forwards to the owner's private Gmail; public MX records are `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, and `mx3.mail.ovh.net` |
| Vercel | `pawelmaczkaczarnecki` | `pawelmaczkaczarnecki's projects` (Pro) | `cvunfold`, linked to `cvunfold/cvunfold` | Production at `cvunfold.com`; `cvunfold.pl`, `www.cvunfold.pl`, and `www.cvunfold.com` redirect with 308 to `cvunfold.com`; Preview enabled | Approved; domain switch and production deployment `dpl_H6RtKey57vYcs1sPUrKCD4ZPvqDc` verified 2026-08-10; Supabase integration restricted to this project |
| OpenAI Platform | private business account | Personal organization | `CVUnfold` (`proj_SL3YR6PScXe3vj52C31b1FyJ`) | Vercel Production / Preview | Project and restricted backend key approved; Usage Tier 1 and funded auto-reload verified; capped PL/EN live eval passed 2026-08-09 and its temporary key was revoked |
| Google Ads | `pawelmaczkaczarnecki@gmail.com` | private business Google account | customer `461-172-5021`; campaign `24116869899` | Production / active learning | Search campaign is active with an 80 PLN daily budget and direct final URL `https://cvunfold.com/`; campaign final URL suffix `utm_source=google&utm_medium=cpc&utm_campaign=cv_developer_pl_search&utm_content={adgroupid}-{creative}&utm_term={keyword}` passed the Google landing-page test and was saved 2026-08-13; the sole primary `Zakup` conversion remains unverified and must be confirmed before scaling spend |
| Google Search Console | `pawelmaczkaczarnecki@gmail.com` | private business Google account | URL-prefix property `https://cvunfold.com/`; Domain property `cvunfold.com` | Production | URL-prefix property verified by HTML meta tag; Domain property verified through the OVH DNS TXT record on 2026-08-10; `/sitemap.xml` has status **Success** with 30 discovered URLs in the domain view |

## Deployment preflight — 2026-08-14

| Service | Account | Organization / team | Project | Environment | Verification |
| --- | --- | --- | --- | --- | --- |
| GitHub | `pawelmaczkaczarnecki` | `cvunfold` | `cvunfold/cvunfold` | feature branch `feat/mobile-report-progress` → `main` | Live CLI auth and repository metadata verified before push; remote is `https://github.com/cvunfold/cvunfold.git` |
| Vercel | `pawelmaczkaczarnecki` | `pawelmaczkaczarnecki's projects` | `cvunfold` (`prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A`) | Preview, then Production at `cvunfold.com` | Live CLI identity, owner, project ID, Git link and production domain verified before deployment; Vercel Preview is protected by Vercel authentication and has Turnstile disabled, while Production retains its hostname-bound live credentials |

Before any write, revalidate the service, account, organization/team, project,
and environment in the destination. If any field differs or is missing, stop
the write and update this registry only after explicit verification.
