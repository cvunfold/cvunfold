# CVUnfold external resource registry

Last verified: 2026-08-08 (Europe/Warsaw).

This registry is the preflight source of truth for external writes. A shared
email address is not an ownership signal. NeoPadel and all other client or
employer resources remain forbidden.

| Service | Account | Organization / team | Project | Environment | Write status |
| --- | --- | --- | --- | --- | --- |
| GitHub | `pawelmaczkaczarnecki` | `cvunfold` | `cvunfold` | `main` | Approved for CVUnfold bootstrap |
| Supabase | private business account | `CVUnfold` | `cvunfold-prod` (`yttktyctjbciyqjpvunv`) linked to `cvunfold/cvunfold` | `main` / Production | Approved; GitHub App restricted to the single CVUnfold repository |
| Stripe | private business account | `CV Unfold sandbox` (`acct_1U25LrB1aVOAs9bf`) | CVUnfold payments | Test | Approved for test-only writes |
| Vercel | `pawelmaczkaczarnecki` | `pawelmaczkaczarnecki's projects` (Hobby) | Import prepared from `cvunfold/cvunfold`; project not created | Production / Preview / Development pending | Blocked at Pro / Pro Trial selection required for a private GitHub organization repository |
| OpenAI Platform | Personal organization | Personal organization | Default project | Unknown | Blocked until a dedicated CVUnfold project is created and verified |

Before any write, revalidate the service, account, organization/team, project,
and environment in the destination. If any field differs or is missing, stop
the write and update this registry only after explicit verification.
