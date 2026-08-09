# Launch audit — 2026-08-09

Zakres: branch `launch/production-readiness`, aplikacja Next.js, flow PL i EN, API analizy, Supabase, OpenAI, Stripe Checkout, pomiar oraz retencja. Audyt nie jest opinią prawną. Produkcja nie została nadpisana.

## Diagnoza

Dotychczasowy produkt działał, ale komunikował się zbyt podobnie do checkera ATS, ujawniał wyróżnik za późno i nie miał wystarczająco twardej granicy między teaserem a raportem. Pomiar zakupu, retencja, obsługa EUR, pełna wersja angielska i automatyczne testy launchowe były niekompletne.

Po zmianach główna ścieżka odpowiada kolejno na: dla kogo jest produkt, jaki poziom komunikuje CV, czym analiza różni się od ATS, co jest bezpłatne, ile kosztuje raport i jak chronione są dane. Nazwa produktu, domena, dane firmy i e-mail wsparcia są konfiguracją, a nie częścią logiki.

## P0 — blokuje launch

| Problem | Stan kodu | Stan launchu |
|---|---|---|
| Pełny raport mógłby wyciec przed płatnością | Naprawione: projekcja teasera powstaje na serwerze; pełne pola nie trafiają do HTML, RSC ani API dla nieopłaconej analizy | Potwierdzone na preview dla nowych analiz PL i EN; płatny wariant czeka na test Stripe live |
| Odblokowanie po samym parametrze URL | Naprawione: token z fragmentu jest jednorazowo wymieniany na rotowaną sesję `HttpOnly`; płatność jest sprawdzana serwerowo | Preview zachowuje teaser po refresh i anulowaniu Checkout; pełne odblokowanie czeka na płatność testową |
| Webhook i zakup bez silnej idempotencji | Naprawione w migracji: podpis Stripe, tabela zdarzeń, transakcyjna funkcja fulfillment i deduplikowany purchase | Migracja zastosowana 2026-08-09 w `cvunfold-prod`; test preview nadal wymagany |
| Niespójne ceny | Naprawione: serwer pobiera Stripe Price i weryfikuje kwotę, walutę, aktywność i tryb one-time; PLN 29/39 i EUR 9/12 mają osobne Price IDs | Sandbox Checkout potwierdzony dla 29 PLN i 9 EUR; live PLN istnieje, live EUR nadal wymaga utworzenia i potwierdzenia |
| Brak pełnego EN | Naprawione: landing, upload, błędy, raport, artykuły, SEO i dokumenty informacyjne mają wersję `/en` | Copy prawne wymaga akceptacji właściciela |
| Brak gwarantowanej retencji/usunięcia | Naprawione w kodzie: plik jest analizowany wyłącznie w pamięci, raport ma termin, delete jest natychmiastowy, cron czyści wygasłe rekordy | Preview potwierdziło brak `temporary_file_key` dla wszystkich testowych analiz; autoryzowany cron trzeba sprawdzić po deployu produkcyjnym |
| Dane prywatne w analytics/referrerze | Naprawione: zamknięta allowlista eventów, anonimowa lokalizacja raportu, `no-referrer`, brak automatycznego page view na raporcie i brak CV/JD/nazwy pliku; po zgodzie tag może wysłać wyłącznie bezpieczny purchase | GA4 DebugView i Tag Assistant wymagają identyfikatorów właściciela |
| Nadużycie anonimowego AI | Naprawione: krótkoterminowy i trwały limit, limit tekstu/pliku/stron, kontrola archiwum DOCX, token-free CV detection, opcjonalny Turnstile sprawdzany na serwerze | Dla ruchu reklamowego zalecane jest skonfigurowanie produkcyjnego Turnstile |
| Dokumenty publiczne z fikcyjnymi danymi | Nie wymyślamy danych; strony jawnie blokują sprzedaż, gdy brakuje danych firmy | Dane firmy, support i akceptacja treści są wymagane przed live sales |
| Semantyczna jakość modelu | Guardraile i 13 syntetycznych przypadków przechodzą lokalnie; płatny 13×PL/EN `eval:live` zakończył się PASS WITH OBSERVATION przy limicie 50 zł | 24/24 warianty modelowe i 2/2 odrzucenia przed modelem zaakceptowane; koszt autorytatywny około 22,42 zł, bez krytycznych halucynacji |

## P1 — przed Google Ads

| Problem | Zmiana |
|---|---|
| Generyczne hero i dominujący score | Hero pyta o rzeczywisty poziom; pierwsza karta pokazuje postrzegany poziom i pierwsze 20 sekund, score jest drugorzędny |
| Wyróżnik względem ATS za nisko | Porównanie znajduje się bezpośrednio pod demonstracją wyniku |
| Cena dopiero po uploadzie | 29/39 zł oraz €9/€12 są widoczne w hero, cenniku i formularzu |
| Za długi landing | Skrócony i ułożony jako lejek; artykuły są nisko i są tylko trzy |
| Słaby teaser | Pokazuje poziom, werdykt, first impression, główny problem, dowód, liczby i zakres odblokowania |
| Brak pełnego przykładu | Publiczny, syntetyczny raport PL i EN zawiera dowody, problem, znaczenie, typ sugestii i bezpieczny krok |
| Brak mierzalnego lejka | GA4/Ads adapter, Consent Mode v2, UTM persistence, zdarzenia serwerowe, deduplikowany purchase i bezpieczne diagnostics. Błąd zapisu eventów bez dedupe key został naprawiony w `c3b0192`; preview zapisało bezpieczny `teaser_viewed` bez PII |
| Niepełne SEO | Kanoniczne PL `/`, EN `/en`, alternates, sitemap, robots, OG, RSS, noindex prywatnych stron i redirecty legacy |
| Słabe error states | Zlokalizowane komunikaty dla formatu, sygnatury, skanu/ekstrakcji, limitu, modelu, storage, timeoutu i Turnstile |

## P2 — po pierwszych użytkownikach

- Testy A/B komunikatu i ceny, dopiero po uzyskaniu wiarygodnej próbki.
- Dalsze role produktowe, marketingowe i designerskie.
- Rozbudowane animacje oraz dodatkowe formaty eksportu.
- Integracja kosztów Google Ads i automatyczne liczenie CAC.
- Benchmark kalibracyjny z ocenami ekspertów rekrutacyjnych.

## Weryfikacja architektury

- Źródłowe CV nie jest zapisywane do storage ani bazy; parser operuje na buforze w pamięci.
- Supabase ma RLS i brak polityk klienta; dostęp odbywa się przez serwerową service role.
- Token raportu jest losowy, przechowywany jako hash, rotowany po utworzeniu sesji i nie jest częścią normalnego URL raportu.
- Raporty i API mają `noindex`; raport ma `Referrer-Policy: no-referrer`, a consented tag dostaje wyłącznie statyczną lokalizację bez tokenu i bez automatycznego page view.
- Log błędu zawiera wyłącznie kategorię, nie CV, prompt, raport, plik ani PII.
- OpenAI Responses używa structured output oraz `store: false`; wynik przechodzi Zod, evidence validation, bezpieczny rewrite guard i deterministyczny scoring.

## Performance i render QA

- Production build, landing mobile 390 px, 4× CPU, 150 ms latency / 1.6 Mbps: LCP 760 ms, CLS 0, DCL 759 ms, load 1109 ms, 148 KB transferu, 12 zasobów.
- To lokalny pomiar laboratoryjny, nie dane terenowe CrUX; INP wymaga rzeczywistych sesji.
- Screenshot QA: 360, 390, 768, 1024 i 1440 px; landing PL/EN, upload PL/EN i przykładowy raport. Brak overflow, błędów konsoli i failed requests.
- Build raportuje około 109 KB First Load JS dla publicznego landingu; OpenAI, Stripe i parsery nie są importowane do jego kodu klienta.
- Preview z commita `c3b0192` osiągnęło stan `READY`. Dynamiczny smoke objął landing PL/EN, prawdziwe analizy syntetycznych PDF/DOCX, teaser, refresh, sandbox Checkout 29 PLN i 9 EUR, poprawny cancel URL oraz zapis bezpiecznego eventu serwerowego.
- Pierwszy smoke ujawnił brak fontu w śladzie funkcji Open Graph. Dodano jawny `outputFileTracingIncludes`, ponowny build i preview przeszły, `/opengraph-image` zwraca poprawną odpowiedź, a logi poprawionego deploymentu nie zawierają błędów runtime.

## Otwarte bramki

1. Autoryzowany test Vercel Cron po deployu produkcyjnym; migracja Supabase i ochrona `CRON_SECRET` są zastosowane.
2. Stripe sandbox checkout/cancel działa. Nadal potrzebne są live EUR Price IDs oraz jeden zakup 29 PLN po deployu, aby sprawdzić webhook, odblokowanie i dokładnie jeden `purchase`.
3. Dane firmy są publicznie uzupełnione, `support@cvunfold.com` przekierowuje przez OVH; pozostały test dostarczenia wiadomości i akceptacja draftów prawnych przez właściciela.
4. GA4 istnieje (`G-D8TP3LQSJD`); Google Ads jest w onboardingu, Search Console nie ma jeszcze property, a consent/purchase wymaga finalnego DebugView/Tag Assistant.
5. Angielski Stripe Checkout używa obecnie wspólnego produktu z polską nazwą. Przed pełnym EN live należy utworzyć zweryfikowane live EUR ceny, najlepiej na osobnych angielskich produktach.
