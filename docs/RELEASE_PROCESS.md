# Production releases

The protected GitHub `main` branch is the source of production code. Open a pull
request, pass the required `Validate release` check, and merge it. Vercel builds
that exact Git commit and runs `pnpm verify` before a deployment can become ready.
This runs lint, unit tests, the production build, and TypeScript checking. The
lockfile is committed and installation must use `pnpm install --frozen-lockfile`.
Unit tests run in an isolated mock environment without inherited deployment
credentials. The production build still receives the configured environment.
GitHub also checks the individual mock flow, public sample report, school offer,
and school demo in desktop and mobile Chromium before allowing a merge. Email
delivery is covered separately by unit tests with a mocked provider.

Keep all runtime sources, public assets, scripts required by the build, tests,
and migration SQL in Git. Keep environment files, credentials, database CLI state,
generated builds, and local research output out of Git. Never deploy a dirty
working directory to production: Vercel can label such a deployment with an old
commit SHA even though its uploaded files differ from that commit.

After merging, verify the deployment reports `source: git`, `target: production`,
`READY`, and the exact merge SHA. Confirm the production domains point to it and
check the home page, analysis page, sample report, school offer, and school demo.
Check that private report and school APIs still reject unauthorized requests.
Do not equate a successful public smoke test with a new payment or authenticated
school-flow test. Database migrations and environment changes require their own
verified scope; merely committing SQL must not apply it to production.

## Incident recovery

Restore a previously verified production deployment by its exact deployment ID.
Use Vercel rollback to hold automatic domain assignment while investigating.
Recover the deployed source files and verify their hashes, preserving later
work separately. Merge those sources through the normal pull-request path before
promoting the verified Git deployment to resume automatic domain assignment.
Do not disable deployment protection or bypass failed required checks.

On 2026-10-16, production was restored to
`dpl_5UCpo1hjBcQwW22QFxrYxpRcQmG3`. A README-only Git deployment had replaced a
newer CLI release whose application changes were absent from Git. Recovery
reconciled 705 source, asset, configuration, migration, and test files against
the deployed file hashes, preserved the newer English README, and normalized
generated TypeScript paths for clean checkouts. The CI workflow and Vercel build
command now use the same validation command.
