# CVUnfold external resource registry

Last verified: 2026-08-08 (Europe/Warsaw).

This registry is the preflight source of truth for external writes. A shared
email address is not an ownership signal. NeoPadel and all other client or
employer resources remain forbidden.

| Service | Account | Organization / team | Project | Environment | Write status |
| --- | --- | --- | --- | --- | --- |
| GitHub | `pawelmaczkaczarnecki` | `cvunfold` | `cvunfold` | `main` | Approved for CVUnfold bootstrap |
| Supabase | private business account | `CVUnfold` | `cvunfold-prod` (`yttktyctjbciyqjpvunv`) linked to `cvunfold/cvunfold` and Vercel `cvunfold` | `main` / Production | Approved; schema active, private `cv-uploads` bucket active, Vercel variables synced, GitHub App restricted to the single CVUnfold repository |
| Stripe | private business account | `CV Unfold sandbox` (`acct_1U25LrB1aVOAs9bf`) | `CVUnfold – Pełna analiza CV` (`prod_V2BcQKq8kms0IC`), price `price_1U27EsB1aVOAs9bfWvS2A6Ky`; webhook `we_1U27FWB1aVOAs9bfLI9ACfQB` | Test | Approved for test-only writes; test credentials, 29 PLN price, and webhook target `cvunfold.vercel.app/api/stripe/webhook` |
| Stripe | private business account | `CV Unfold` (`acct_1U25LlPlwW2w7lmM`) | `CVUnfold – Pełna analiza CV` (`prod_V2BR1jkm290WY2`), price `price_1U274aPlwW2w7lmMeYmto9uN` | Live / Production | Verified CVUnfold-owned; active one-time 29 PLN product. Do not connect until sandbox checkout and webhook pass end to end |
| Vercel | `pawelmaczkaczarnecki` | `pawelmaczkaczarnecki's projects` (Pro) | `cvunfold`, linked to `cvunfold/cvunfold` | Production at `cvunfold.vercel.app`; Preview enabled | Approved; Supabase integration restricted to this project |
| OpenAI Platform | private business account | Personal organization | `CVUnfold` (`proj_SL3YR6PScXe3vj52C31b1FyJ`) | Vercel Production / Preview | Project and restricted backend key approved; API use blocked until the owner explicitly adds credits |

Before any write, revalidate the service, account, organization/team, project,
and environment in the destination. If any field differs or is missing, stop
the write and update this registry only after explicit verification.
