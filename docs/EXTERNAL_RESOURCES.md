# CVUnfold external resource registry

## First-job weighting follow-up, 2026-10-10

Owner requested first-job weight changes, reduced repetition, evidence-reuse review and matched PL/EN tests. GitHub preflight confirmed account pawelmaczkaczarnecki, organization cvunfold, project cvunfold/cvunfold and feature branch feat/preview-test-code. Vercel project prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A belongs to private-business team team_EvE1UIid0T9jxS7TG10FPaAh and is linked to this repository. Preview uses the previously approved CVUnfold OpenAI project and key; no credentials are copied. Testing uses the existing Preview-only bootcamp grant and GPT-6 Luna configuration. The branch daily limit temporarily increases from 50 to 100 for the repeated synthetic tests and is restored after completion. Conservative additional model-cost ceiling: USD 0.50 including retries. Production quota/payment protections remain unchanged.

The earlier same-day suite consumed the Preview hourly allowance. After a 429 before model execution, this branch's hourly allowance temporarily increases from 30 to 50 for the remaining paired fixtures and will also be restored. No quota rows are reset and no client identity is changed.

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

## Career-stage release preflight, 2026-10-09

| Service | Account | Organization/team | Project | Environment | Evidence |
| --- | --- | --- | --- | --- | --- |
| GitHub | pawelmaczkaczarnecki | cvunfold (Organization) | cvunfold/cvunfold | feat/career-stage-analysis, then main | CLI user and repository admin/push permissions verified; remote main 385a5a8 |
| Vercel | pawelmaczkaczarnecki (principal 6I778X3suBF4Vk1QIWkFhnDt) | pawelmaczkaczarnecki's projects, team_EvE1UIid0T9jxS7TG10FPaAh | cvunfold, prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A | branch-scoped Preview, then Git main Production | Live project, team, deployment creator and Git metadata verified; production deployment dpl_9jK2ox5tSwAYJG38jTfA4hb6wZXt belongs to cvunfold/cvunfold at 385a5a8 |
| Supabase | connected owner's private-business Supabase account | CVUnfold, knjrcparhtiwcskiisjh | cvunfold-prod, yttktyctjbciyqjpvunv | Production database also used by Preview; preview test rows explicitly labelled preview | Live project/org metadata, Vercel SUPABASE_URL and migration history verified; no new project or branch provisioned |

Only the new first-job stage migration is intended as new DDL. Existing migration filenames/content are reconciled to actual applied history in Git, without replaying or rewriting production migration history. Test-access variables will be limited to this feature branch's Preview environment. No Stripe resources or real payment are part of this release test.

The owner explicitly approved the described shared-database stage migration after the automatic review explained its constraint/payment-function risk on 2026-10-09. Only the existing stage allowlist is extended; prices, amounts, payment checks and execution privileges are preserved.

The approved first-job stage migration was applied as 20261009194033 on 2026-10-09. Live verification confirmed the new constraint, measurement allowlist and unchanged service-role-only execution privileges.

## Simpler Preview test access, 2026-10-09

Fresh GitHub CLI checks confirmed account pawelmaczkaczarnecki, organization cvunfold, repository cvunfold/cvunfold, ADMIN access. Writes use feat/preview-test-code. Vercel deployment and environment metadata confirmed account/principal 6I778X3suBF4Vk1QIWkFhnDt, team team_EvE1UIid0T9jxS7TG10FPaAh (pawelmaczkaczarnecki's projects), project cvunfold/prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A. Only branch-scoped Preview variables and a new Preview deployment are changed. The owner requested a simpler code and removal/repositioning of the test UI. No production configuration, database or Stripe writes are involved.

The owner additionally requested transparent stage prefill and using experience years as a supporting signal. The same CVUnfold GitHub branch/PR and branch-scoped Vercel Preview are used for this follow-up, with no database, production environment or Stripe changes.

## GPT-6 Luna comparison, 2026-10-09

The owner authorized changing the review model if cheaper and better, with tests first. Fresh GitHub checks confirmed account pawelmaczkaczarnecki, org/repo cvunfold/cvunfold and ADMIN access; writes remain on feat/preview-test-code / PR 44. Vercel live project/env metadata confirms project cvunfold/prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A, team team_EvE1UIid0T9jxS7TG10FPaAh, account/principal 6I778X3suBF4Vk1QIWkFhnDt. First writes are branch-scoped Preview model/experiment configuration only. Supabase remains the owner's CVUnfold org knjrcparhtiwcskiisjh, project cvunfold-prod/yttktyctjbciyqjpvunv; generated synthetic rows are marked preview. Existing CVUnfold server API key is reused, no key or provider provisioning. Production model changes remain conditional on the paired evaluation.

The controlled comparison also uses a redeployment at the same SHA with branch-scoped model 5.6 Luna as a control. Preview-only quotas are bounded at 30/hour and 50/day for the synthetic evaluation; no production quota changes. Additional paired inputs remove the fixture-only annotation from both documents, preserving the actual CV facts.

## Fixed evidence score and GPT-6 release, 2026-10-10

The owner explicitly requested deploying the missing-evidence policy, first-job priorities and GPT-6 Luna, with PL/EN tests. Live GitHub metadata confirmed account pawelmaczkaczarnecki, organization/repository cvunfold/cvunfold and ADMIN access; use feat/preview-test-code / PR 44, then Git main. Vercel project/env metadata confirmed cvunfold/prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A, team team_EvE1UIid0T9jxS7TG10FPaAh, principal 6I778X3suBF4Vk1QIWkFhnDt. Preview model changes are branch-scoped; Production OPENAI_REVIEW_MODEL is changed to gpt-6-luna only after live Preview validation and before the approved Git-main release. Existing fallback, credentials and quotas remain as configured. Supabase remains CVUnfold org knjrcparhtiwcskiisjh and cvunfold-prod/yttktyctjbciyqjpvunv, freshly verified; only ordinary synthetic Preview analysis rows are written. No DDL, Stripe or provider-key changes. Test-access flags remain Preview-only.

The matched release suite contains 20 planned analyses on 16 paired PL/EN inputs. To accommodate earlier synthetic runs in the rolling daily quota, the feat/preview-test-code Preview daily cap is temporarily 100, restored to its existing 50 after the suite. Hourly Preview cap remains 30; Production quotas are unchanged. The live-eval estimate ceiling, including a retry reserve, is USD 0.50.

## Conversational revision summary, 2026-10-10

Owner requested questions before edits, report UI polish and a repeated synthetic-CV test. Preflight: GitHub account pawelmaczkaczarnecki, ADMIN on organization/repository cvunfold/cvunfold; Vercel project cvunfold (prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A), private-business team team_EvE1UIid0T9jxS7TG10FPaAh. Work uses feat/preview-test-code Preview and main Production after validation. The approved Preview runtime retains its own OpenAI/Supabase configuration and Preview-only bootcamp grants. Six additional analyses have a conservative USD 0.10 ceiling. Test answers come from established synthetic fixtures; no real candidate facts are invented. No credentials, payment rules, schema or quotas change.
