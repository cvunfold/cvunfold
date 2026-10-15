# CV Unfold

An independent project by Paweł Mączka-Czarnecki, built from product concept and UI through backend integrations and deployment.

CV Unfold helps people understand what their CV communicates and how to improve it without inventing experience. It combines document parsing, structured AI feedback and practical revision suggestions in a Polish and English web application.

**[Visit CV Unfold](https://cvunfold.com)**

## What the application does

- Accepts PDF and DOCX files and extracts their text on the server.
- Reviews the CV against role and career-stage criteria, with optional job-description context.
- Connects feedback to evidence in the document and asks for clarification when information is missing.
- Provides a report preview, followed by a paid report with strengths, issues, suggested changes and questions to work through.
- Supports reviewing suggested revisions while keeping the candidate responsible for confirming the facts.

The report evaluates how a CV presents experience. It does not verify a person's skills, predict a hiring decision or guarantee an ATS outcome.

## Engineering approach

The project is developed with AI coding tools. I define the product requirements, direct implementation, review changes and validate the resulting behavior and usability.

- **Frontend:** Next.js App Router, React, strict TypeScript and responsive CSS, with Polish and English interfaces.
- **Backend:** Next.js route handlers, server-side PDF/DOCX parsing, Supabase/Postgres persistence and Stripe payments.
- **AI pipeline:** versioned prompts, Zod report schemas, evidence-reference validation and scores calculated in application code. Uploaded CVs and job descriptions are treated as untrusted input.
- **Access control:** report tokens are hashed before storage. Server routes return a preview until report access has been verified, including payment verification for paid access. Checkout redirects alone do not unlock a report.
- **Payment processing:** signed Stripe webhooks and idempotent fulfillment protect against repeated delivery of payment events.
- **Privacy:** retention and cleanup mechanisms, server-side credentials, and analytics events designed to exclude CV and report content. Optional Google analytics and advertising tags are consent-gated.
- **Validation:** Vitest and Testing Library for automated checks, Playwright and axe for browser and accessibility checks, plus synthetic evaluation fixtures for report guardrails.

## Run locally

Use Node.js 24 and the project's pinned pnpm version, 11.16.0.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000) for Polish or [localhost:3000/en](http://localhost:3000/en) for English.

The environment template enables `MOCK_MODE=true`, so the local demo needs no OpenAI, Supabase or Stripe account. A synthetic CV is preselected: give upload consent, run the analysis, view the preview and use the simulated checkout to open the report.

Mock reports are fixtures, not live AI assessments. The mock store is process-local and resets when the server restarts. Simulated payment unlocking is restricted to mock mode outside production.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm eval
pnpm build
```

Install Chromium before running browser checks:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:a11y
```

`pnpm eval` runs deterministic checks using synthetic fixtures. It does not measure the quality of a live model. Live evaluations are separate, require provider credentials and incur API costs; see [AI evaluation](docs/AI_EVALUATION.md).

## Real integrations

Use [.env.example](.env.example) as the configuration reference. Running with real integrations requires `MOCK_MODE=false`, server-side OpenAI and Supabase credentials, Stripe keys and prices, webhook configuration, and private application secrets. Do not use placeholder secrets in a deployed environment.

Set `OPENAI_REVIEW_MODEL` to configure the model used for live analysis. Prompts and report schemas are versioned, and reports retain model provenance so results can be traced to the configuration that produced them.

Public brand, domain and company details are configurable through `NEXT_PUBLIC_BRAND_*` and `NEXT_PUBLIC_COMPANY_*`. The repository's `cvunfold` identifier remains independent of the display name, storage keys and historical URLs.

Never commit credentials, real CVs, private reports or report-access links. Do not include CV or report content in application logs or analytics.

## Code map

| Area | Location |
| --- | --- |
| Pages and server routes | [`src/app`](src/app) |
| UI and upload/report flows | [`src/components`](src/components) |
| AI review, prompts and report validation | [`src/lib/ai`](src/lib/ai) |
| Document parsing | [`src/lib/document-parsing`](src/lib/document-parsing) |
| Storage adapters | [`src/lib/data`](src/lib/data) |
| Access tokens and request protection | [`src/lib/security`](src/lib/security) |
| Database migrations | [`supabase/migrations`](supabase/migrations) |
| Automated tests | [`tests`](tests) |
| Synthetic evaluation inputs | [`fixtures`](fixtures) |

Further notes: [architecture](docs/ARCHITECTURE.md), [privacy and retention](docs/PRIVACY_AND_RETENTION.md), and [AI evaluation](docs/AI_EVALUATION.md). Some internal documentation is in Polish.
