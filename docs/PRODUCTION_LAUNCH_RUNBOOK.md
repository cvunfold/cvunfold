# Production launch runbook

Każda operacja zewnętrzna wymaga preflightu: **SERVICE, ACCOUNT, ORGANIZATION/TEAM, PROJECT, ENVIRONMENT**. Wspólny Gmail nie potwierdza własności. Neopadel i zasoby innych klientów są zabronione.

## 24 godziny przed launch

- [ ] Vercel: potwierdzone konto, team, projekt CVUnfold i Production.
- [ ] Supabase: potwierdzony projekt CVUnfold; migracje zastosowane; RLS/advisors bez krytycznych uwag.
- [ ] Stripe: potwierdzone konto CV Unfold, live products 29/39 PLN i 9/12 EUR, Price IDs, live webhook i secret.
- [x] OpenAI: potwierdzony projekt CVUnfold, limit 50 zł i live eval PL/EN zaliczony 2026-08-09; przed produkcją ustawić zweryfikowane modele i stawki w env.
- [ ] Brand/domain/company/support env uzupełnione; support e-mail działa.
- [ ] GA4 ID, Ads ID/Label, Search Console verification ustawione.
- [ ] Consent i dokumenty prawne zaakceptowane przez właściciela; polityka zwrotów/support w Stripe zgodne.
- [ ] `ACCESS_TOKEN_SECRET`, `RATE_LIMIT_HMAC_SECRET`, `CRON_SECRET`, `ADMIN_SECRET` są unikalne i losowe.
- [ ] Turnstile ma osobne prod keys i hostname aktualnej domeny; klient i sekret występują parą.
- [ ] Retencja 30 dni zgodna z copy; Vercel Cron widoczny i chroniony.
- [ ] Backup/retencja Supabase nie zaprzeczają polityce publicznej.

## Bezpośrednio przed launch

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm eval`, `pnpm eval:live`, `pnpm build`, `pnpm test:e2e` — PASS; `eval:live` bez `--execute` jest tylko preflightem.
- [ ] Za osobną zgodą kosztową: `pnpm eval:live -- --execute`; preflight ≤ 20 zł, 100% guardraili i ręczny przegląd jakości PL/EN.
- [ ] Preview: 360, 390, 768, 1024, 1440; klawiatura, focus, cookie banner i brak poziomego scrolla.
- [ ] Upload tekstowego PDF i DOCX, błąd skanu, za duży plik, zła sygnatura.
- [ ] Teaser ma dowód, ale pełny raport nie występuje w HTML/API/RSC.
- [ ] Stripe sandbox: success, cancel, delayed webhook, duplicate webhook i return refresh.
- [ ] Za osobną zgodą: jedna prawdziwa płatność, odblokowanie, receipt, saldo i ewentualny refund.
- [ ] Pełny raport: refresh, bezpieczny link, print/PDF, feedback, delete i expiry.
- [ ] GA4 DebugView/Tag Assistant: consent denied/accepted; brak PII i prywatnych URL-i.
- [ ] Google Ads: purchase primary; reszta secondary; brak równoległej primary importowanej z GA4.
- [ ] `/robots.txt`, `/sitemap.xml`, canonical, OG, 404, HTTPS, www redirect.

## Pierwsze 60 minut

- [ ] Analysis failure rate i top error categories.
- [ ] Input/output tokens i AI cost; zatrzymaj ruch przy nagłym skoku.
- [ ] Webhook delivery/retry i checkout → purchase.
- [ ] Liczba udanych analiz, teaserów, checkoutów i zakupów.
- [ ] Logi ręcznie sprawdzone: brak CV, JD, raportu, tokenu, PII i pełnego promptu.
- [ ] Support e-mail odbiera wiadomości.

## Pierwszy dzień

- [ ] Search Terms i negatywne frazy.
- [ ] landing → upload, upload → analysis success, teaser → checkout, checkout → purchase.
- [ ] Przychód PLN/EUR, realny CAC po dołączeniu wydatku, AI cost/source.
- [ ] Najczęstsze błędy użytkowników i feedback jakości raportu.
- [ ] Nie optymalizuj na sam checkout; purchase pozostaje primary.

## Po wydaniu około 250 zł

- [ ] Dodaj frazy z jednoznacznie złą intencją.
- [ ] Wyłącz ewidentnie nieskuteczny ruch, ale zachowaj dane do porównania.
- [ ] Porównaj reklamę, query i landing message.
- [ ] Nie zmieniaj wszystkiego jednocześnie.

## Po pierwszym teście

Zapisz: spend, przychód, CAC, purchase conversion rate, najlepsze keywordy, największy drop-off, AI cost, jakość/feedback. Podejmij jedną decyzję: **skalować**, **poprawić** albo **zmienić positioning**.

## Stripe live checklist właściciela

1. Aktywuj live mode i zweryfikuj business/support/bank details.
2. Utwórz osobne one-time Prices dla 29 PLN, 39 PLN, 9 EUR i 12 EUR.
3. Dodaj live endpoint `/api/stripe/webhook` dla completed, async success/fail, expired i refund.
4. Wklej live secret/Price IDs wyłącznie do Production env CVUnfold.
5. Zweryfikuj statement descriptor, refund policy i aktywne payment methods; nie obiecuj metod niewidocznych w Checkout.
6. Za osobną zgodą wykonaj realny zakup, sprawdź saldo/receipt i ewentualnie refund.

Referencje: [Stripe webhooks](https://docs.stripe.com/webhooks), [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment), [Vercel secured cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/), [Supabase Cron](https://supabase.com/docs/guides/cron).
