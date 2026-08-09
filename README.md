# Merivela

The repository and current domain still use the `cvunfold` technical identifier. The public brand is configured independently so it can be changed without migrating storage keys, integrations or historical URLs.

Merytoryczna, evidence-first analiza CV dla Frontend Developerów. MVP działa lokalnie bez kont zewnętrznych w `MOCK_MODE=true`.

## Start

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Otwórz `http://localhost:3000` (polski) albo `http://localhost:3000/en` (angielski). W mock mode syntetyczny plik jest już wybrany; zaznacz zgodę, uruchom analizę, zobacz teaser, użyj mock checkout i przejdź do pełnego raportu.

## Kontrole jakości

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm eval
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Mock unlock działa tylko gdy `MOCK_MODE=true` i `NODE_ENV !== production`. Pełne raporty nie są serializowane do HTML ani API przed serwerowym odblokowaniem.

## Architektura

- Next.js App Router + TypeScript strict
- wersjonowany Zod schema, konfiguracja rubryk i deterministyczny scoring
- lokalny in-memory adapter w mock mode; migracja Supabase gotowa do podłączenia
- server-only access tokens, teaser projection, retention cleanup i diagnostics API
- Stripe Checkout z serwerową weryfikacją płatności i idempotentnym fulfillmentem
- opcjonalny GA4 + Google Ads z Consent Mode v2; tagi ładują się dopiero po zgodzie, a ścieżki prywatnych raportów są anonimizowane
- marka, domena i dane firmy są konfigurowane przez `NEXT_PUBLIC_BRAND_*` / `NEXT_PUBLIC_COMPANY_*`; nazwa produktu nie jest częścią logiki płatności ani danych
- osobne rynki Stripe: PLN (`29/39 zł`) i EUR (`€9/€12`) z oddzielnymi Price IDs

Nie commituj `.env`. Nie loguj treści CV ani raportów.
