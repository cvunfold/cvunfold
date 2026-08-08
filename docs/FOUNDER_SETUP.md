# Co musisz zrobić Ty, żebym resztę mógł zrobić sam

## POTRZEBNE TERAZ

Na potrzeby lokalnego mock flow: nic. Nie podawaj mi haseł, kodów 2FA ani sekretów w czacie.

## POTRZEBNE PRZED PIERWSZYM DEPLOYEM

1. **GitHub:** wejdź na github.com na prywatnym koncie właściciela, upewnij się, że nie jesteś w organizacji Neopadel, utwórz prywatne repo `cvunfold`, bez README. Napisz „GitHub gotowy”. Skonfiguruję origin i push.
2. **Vercel:** wejdź na vercel.com w dedykowanej sesji, utwórz team/scope `CVUnfold`, nie używaj teamu Neopadel. Nie importuj jeszcze repo, jeśli scope jest niejednoznaczny. Gdy dashboard pokazuje `CVUnfold`, napisz „Vercel gotowy”. Skonfiguruję projekt `cvunfold` i preview.
3. **Supabase:** wejdź na supabase.com/dashboard, utwórz Organization `CVUnfold`, potem projekt `cvunfold-prod` w regionie UE. Zapisz hasło bazy w menedżerze haseł. Nie twórz zasobu w organizacji Neopadel. Gdy projekt działa, napisz „Supabase gotowy”. Wgram migracje, utworzę prywatny bucket i sekrety Vercel.
4. **OpenAI Platform:** w platform.openai.com utwórz project `CVUnfold`, ustaw niski miesięczny limit/alert kosztowy i billing własnej działalności. Nie używaj projektu innej firmy. Nie wklejaj klucza do czatu; po zalogowaniu napisz „OpenAI gotowy”, a przeprowadzę dalszą konfigurację w secret store.

## POTRZEBNE PRZED PRZYJĘCIEM PRAWDZIWEJ PŁATNOŚCI

1. **Stripe:** zaloguj się do konta własnej działalności, nie Neopadel. Pracuj w Sandbox/Test mode. Uzupełnij dane firmy dopiero w panelu Stripe. Napisz „Stripe test gotowy”; utworzę produkty `CVUnfold Full CV Review` i `CVUnfold CV Review + Job Match`, ceny 29/39 PLN oraz webhook testowy.
2. Przed live mode właściciel potwierdza dane firmy, rachunek wypłat, statement descriptor, walutę, politykę zwrotów, dane kontaktowe i dostępne metody płatności. Księgowa potwierdza ewidencję i VAT; prawnik sprawdza regulamin, privacy i zgodę na usługę cyfrową.
3. Prawdziwa płatność i pierwszy production deploy wymagają osobnej zgody właściciela.

## OPCJONALNE / PÓŹNIEJ

1. **Domeny:** niczego nie kupuj teraz. Przed zakupem sprawdzę live dostępność `cvunfold.com` i `cvunfold.pl`, cenę pierwszego roku, renewal i registrar. Zakup wyłącznie po akceptacji finalnego kosztu.
2. **Analytics:** utwórz osobny projekt PostHog `CVUnfold` dopiero po preview. Adapter nie wysyła treści CV ani raportu.
3. **Sentry/Turnstile:** osobne projekty CVUnfold po walidacji potrzeby; PII i prompty muszą być scrubowane.

## Status zasobów

| Zasób | Status |
|---|---|
| Lokalny workspace | SAFE |
| Dedykowane konta/projekty CVUnfold | UNKNOWN, dopóki właściciel ich nie potwierdzi |
| Neopadel i zasoby innych klientów | FORBIDDEN |
