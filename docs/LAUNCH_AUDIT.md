# Launch audit — 2026-08-09

Zakres: branch `launch/production-readiness`, aplikacja Next.js, flow PL i EN, API analizy, Supabase, OpenAI, Stripe Checkout, pomiar oraz retencja. Audyt nie jest opinią prawną. Produkcja nie została nadpisana.

## Diagnoza

Dotychczasowy produkt działał, ale komunikował się zbyt podobnie do checkera ATS, ujawniał wyróżnik za późno i nie miał wystarczająco twardej granicy między teaserem a raportem. Pomiar zakupu, retencja, obsługa EUR, pełna wersja angielska i automatyczne testy launchowe były niekompletne.

Po zmianach główna ścieżka odpowiada kolejno na: dla kogo jest produkt, jaki poziom komunikuje CV, czym analiza różni się od ATS, co jest bezpłatne, ile kosztuje raport i jak chronione są dane. Nazwa produktu, domena, dane firmy i e-mail wsparcia są konfiguracją, a nie częścią logiki.

## P0 — blokuje launch

| Problem | Stan kodu | Stan launchu |
|---|---|---|
| Pełny raport mógłby wyciec przed płatnością | Naprawione: projekcja teasera powstaje na serwerze; pełne pola nie trafiają do HTML, RSC ani API dla nieopłaconej analizy | Do potwierdzenia testem Stripe sandbox na preview |
| Odblokowanie po samym parametrze URL | Naprawione: token z fragmentu jest jednorazowo wymieniany na rotowaną sesję `HttpOnly`; płatność jest sprawdzana serwerowo | Do smoke testu preview |
| Webhook i zakup bez silnej idempotencji | Naprawione w migracji: podpis Stripe, tabela zdarzeń, transakcyjna funkcja fulfillment i deduplikowany purchase | Migracja musi zostać zastosowana w projekcie Supabase CVUnfold |
| Niespójne ceny | Naprawione: serwer pobiera Stripe Price i weryfikuje kwotę, walutę, aktywność i tryb one-time; PLN 29/39 i EUR 9/12 mają osobne Price IDs | Właściciel musi utworzyć/zweryfikować live Price IDs |
| Brak pełnego EN | Naprawione: landing, upload, błędy, raport, artykuły, SEO i dokumenty informacyjne mają wersję `/en` | Copy prawne wymaga akceptacji właściciela |
| Brak gwarantowanej retencji/usunięcia | Naprawione w kodzie: plik jest analizowany wyłącznie w pamięci, raport ma termin, delete jest natychmiastowy, cron czyści wygasłe rekordy | `CRON_SECRET` i cron trzeba zweryfikować po deployu |
| Dane prywatne w analytics/referrerze | Naprawione: zamknięta allowlista eventów, anonimowa lokalizacja raportu, `no-referrer`, brak Google tag na raporcie, brak CV/JD/nazwy pliku | GA4 DebugView i Tag Assistant wymagają identyfikatorów właściciela |
| Nadużycie anonimowego AI | Naprawione: krótkoterminowy i trwały limit, limit tekstu/pliku/stron, kontrola archiwum DOCX, token-free CV detection, opcjonalny Turnstile sprawdzany na serwerze | Dla ruchu reklamowego zalecane jest skonfigurowanie produkcyjnego Turnstile |
| Dokumenty publiczne z fikcyjnymi danymi | Nie wymyślamy danych; strony jawnie blokują sprzedaż, gdy brakuje danych firmy | Dane firmy, support i akceptacja treści są wymagane przed live sales |
| Semantyczna jakość modelu | Guardraile i 13 syntetycznych przypadków przechodzą lokalnie | Płatny live-model eval i ręczny przegląd raportów nadal blokują reklamy |

## P1 — przed Google Ads

| Problem | Zmiana |
|---|---|
| Generyczne hero i dominujący score | Hero pyta o rzeczywisty poziom; pierwsza karta pokazuje postrzegany poziom i pierwsze 20 sekund, score jest drugorzędny |
| Wyróżnik względem ATS za nisko | Porównanie znajduje się bezpośrednio pod demonstracją wyniku |
| Cena dopiero po uploadzie | 29/39 zł oraz €9/€12 są widoczne w hero, cenniku i formularzu |
| Za długi landing | Skrócony i ułożony jako lejek; artykuły są nisko i są tylko trzy |
| Słaby teaser | Pokazuje poziom, werdykt, first impression, główny problem, dowód, liczby i zakres odblokowania |
| Brak pełnego przykładu | Publiczny, syntetyczny raport PL i EN zawiera dowody, problem, znaczenie, typ sugestii i bezpieczny krok |
| Brak mierzalnego lejka | GA4/Ads adapter, Consent Mode v2, UTM persistence, zdarzenia serwerowe, deduplikowany purchase i bezpieczne diagnostics |
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
- Raporty i API mają `noindex`; raport dodatkowo nie ładuje Google tag i ma `Referrer-Policy: no-referrer`.
- Log błędu zawiera wyłącznie kategorię, nie CV, prompt, raport, plik ani PII.
- OpenAI Responses używa structured output oraz `store: false`; wynik przechodzi Zod, evidence validation, bezpieczny rewrite guard i deterministyczny scoring.

## Performance i render QA

- Production build, landing mobile 390 px, 4× CPU, 150 ms latency / 1.6 Mbps: LCP 760 ms, CLS 0, DCL 759 ms, load 1109 ms, 148 KB transferu, 12 zasobów.
- To lokalny pomiar laboratoryjny, nie dane terenowe CrUX; INP wymaga rzeczywistych sesji.
- Screenshot QA: 360, 390, 768, 1024 i 1440 px; landing PL/EN, upload PL/EN i przykładowy raport. Brak overflow, błędów konsoli i failed requests.
- Build raportuje około 108 KB First Load JS dla publicznego landingu; OpenAI, Stripe i parsery nie są importowane do jego kodu klienta.

## Otwarte bramki

1. Zastosowanie migracji w jednoznacznie potwierdzonym projekcie Supabase CVUnfold.
2. Konfiguracja i test Stripe sandbox, następnie osobno live.
3. Płatny live-model eval PL/EN oraz ręczna ocena jakości.
4. Dane firmy, działający support i akceptacja draftów prawnych.
5. GA4/Ads/Search Console oraz test consent/purchase na preview.
6. Preview deployment i pełny smoke test — wyłącznie po potwierdzeniu zespołu/projektu CVUnfold.
