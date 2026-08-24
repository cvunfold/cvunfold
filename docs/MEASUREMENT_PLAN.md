# Measurement plan

## Zasada

Google dostaje wyłącznie parametry z zamkniętej allowlisty. Treść CV, ogłoszenia, raportu, promptu, błędu modelu, nazwa pliku, dane kontaktowe, token i prywatny URL są zabronione. Wybrana opcja `Pozostałe` trafia do pomiaru wyłącznie jako zamknięte `broad_role_enum=other`; nie zbieramy tekstowej nazwy zawodu. Na stronie raportu tag może zostać załadowany dopiero po zgodzie, ale otrzymuje wyłącznie zanonimizowaną lokalizację `/raport` lub `/en/report`, bez automatycznego `page_view`. Pozwala to wysłać potwierdzony `purchase` bez ujawniania prywatnego URL-a. W formularzu i teaserze nie instalujemy session replay ani heatmap.

Rola rozpoznana z CV przez model nie jest parametrem analytics i nigdy nie trafia do GA4 ani Google Ads. Po stronie serwera służy jednorazowo do zwiększenia anonimowego licznika w jednej z zamkniętych kategorii — `supported_it`, `other_it`, `unclear` oraz zestaw konkretnych kategorii spoza IT (`architecture_construction`, `healthcare_medical`, `legal`, `education_academia`, `finance_accounting`, `sales_marketing`, `hr_recruiting`, `public_sector`, `hospitality_retail`, `creative_arts_media`, `engineering_manufacturing_nonit`, `skilled_trades`, `science_research_nonit`, `other_non_it`) — nigdy wolny tekst, i jednym z dwóch ogólnych źródeł (`google_cpc`, `other`). Licznik nie przechowuje identyfikatora analizy, dokładnej roli, daty, UTM, click ID ani treści dokumentu lub raportu. Komórki z mniej niż pięcioma analizami są ukrywane w diagnostics.

Odsłony stron mierzy Vercel Web Analytics — bezciasteczkowo, bez identyfikatora i bez zgody, na podstawie prawnie uzasadnionego interesu. Adres strony przechodzi przez `safeVercelAnalyticsUrl`: fragment (a w nim token dostępu do raportu) znika, ścieżki raportu są sprowadzane do `/raport` lub `/en/report` i tracą całe query, a poza nimi zostają wyłącznie etykiety kampanii `utm_*`. Identyfikatory kliknięcia (`gclid`, `gbraid`, `wbraid`) nie trafiają do Vercela — dostaje je tylko Google, bo tylko on ma czym je rozliczyć.

Consent Mode v2 ma domyślnie cztery stany `denied`; tag jest ładowany dopiero po świadomej zgodzie. Użytkownik ma równorzędne opcje akceptacji, odrzucenia i późniejszej zmiany ustawień. Implementacja odpowiada [aktualnej instrukcji Google](https://developers.google.com/tag-platform/security/guides/consent).

## Eventy

| Event | Moment | Parametry allowlist | Źródło prawdy | Ads | Deduplikacja / test |
|---|---|---|---|---|---|
| `landing_view` | Render `/` lub `/en` po zgodzie | locale, market, `landing_variant`, UTM | GA4 | secondary | raz na page view; DebugView |
| `hero_cta_clicked` | CTA hero/cennik/final | locale, market, placement, wariant, UTM | GA4 | secondary | kliknięcie; DebugView |
| `sample_report_viewed` | Render syntetycznego raportu | locale, market, plan, wariant, rola, seniority | GA4 | secondary | raz po renderze; DebugView |
| `pricing_viewed` | Pierwsze wejście cennika w viewport | locale, market, wariant, UTM | GA4 | secondary | `IntersectionObserver` disconnect |
| `file_picker_opened` | Jawne otwarcie natywnego selektora | locale, market, plan, wariant, role enum, seniority enum | GA4 | diagnostic | przed `input.click()` |
| `file_picker_cancelled` | Wyłącznie natywne zdarzenie `cancel` | jw. | GA4 | diagnostic | bez heurystyki blur/focus |
| `role_autodetected` | Detektor ustawił rolę po wybraniu pliku | locale, market, plan, `detected_role_enum`, wariant, role enum, seniority enum, UTM | GA4 | diagnostic | tylko przy pewnym wyniku i tylko gdy pole nie było tknięte |
| `role_autodetect_corrected` | Użytkownik poprawił rolę ustawioną przez detektor | jw.; `broad_role_enum` niesie rolę poprawioną, `detected_role_enum` proponowaną | GA4 | diagnostic | dolna granica błędu detektora, nie każdy poprawi |
| `upload_completed` | Serwer przyjął i przetworzył upload | jw. | GA4 | secondary | odpowiedź sukcesu API |
| `desktop_handoff_started` | Próba Web Share albo kopiowania | jw. + `handoff_method`, `handoff_origin` | GA4 | diagnostic | przy każdej rzeczywistej próbie |
| `desktop_handoff_completed` | Web Share zakończony albo link skopiowany | jw. | GA4 | diagnostic | dopiero po sukcesie API |
| `handoff_link_opened` | Otwarcie bezpiecznego linku na urządzeniu docelowym | jw. + `handoff_origin` | GA4 | diagnostic | raz po mount |
| `analysis_started` | Submit oraz bezpieczny event serwerowy | jw.; DB: plan + UTM + `role_source` + `detected_role_enum` | GA4 + Supabase | secondary | systemy raportowane oddzielnie |
| `analysis_succeeded` | Walidowany raport zapisany | client: plan/success; server: czas/model/wersje/tokeny/koszt | Supabase | secondary | jeden zapis na analizę |
| `analysis_failed` | Bezpieczna kategoria błędu | locale, market, plan, error_category | Supabase + GA4 | diagnostic | bez raw exception; runtime może dostać tylko techniczne liczniki ekstrakcji z zamkniętej allowlisty opisanej w `PRIVACY_AND_RETENTION.md` |
| `analysis_configuration_failed` | Analiza kończy się błędem konfiguracji dostawcy AI | locale, market, plan, analysis_success | GA4 | diagnostic alert | bez CV, PII, nazwy pliku, promptu i komunikatu dostawcy; alert już przy 1 zdarzeniu |
| `teaser_viewed` | Render nieopłaconego teasera | locale, market, plan | GA4 + Supabase | secondary | raz na mount |
| `unlock_cta_viewed` | CTA zakupu rzeczywiście wchodzi w viewport | locale, market, plan, `purchase_surface`, `payment_method` + zamknięty kontekst | GA4 | diagnostic | raz na kombinację surface/method w danym renderze; szybka płatność jako `express_wallet` dopiero po zgłoszeniu dostępności przez Stripe i wejściu w viewport |
| `unlock_cta_clicked` | Rzeczywista próba użycia CTA zakupu | locale, market, plan, `purchase_surface`, `payment_method` + zamknięty kontekst | GA4 | diagnostic | przy kliknięciu standardowego CTA albo potwierdzeniu oficjalnego przycisku; rzeczywisty wallet jako `apple_pay` lub `google_pay` |
| `checkout_started` | Utworzona sesja Checkout | locale, market, plan + zamknięty kontekst | Supabase + GA4 | secondary | wyłącznie po udanym `createCheckout`; nie przy samym kliknięciu |
| `checkout_cancelled` | Powrót użytkownika z anulowanego Checkout | locale, market, plan | GA4 + Supabase | diagnostic | raz na analizę; cookie raportu + dedupe key |
| `checkout_expired` | Podpisany webhook `checkout.session.expired` | locale, market, plan | Stripe/Supabase | diagnostic | session ID w dedupe key |
| `payment_failed` | Podpisany webhook `checkout.session.async_payment_failed` | locale, market, plan | Stripe/Supabase | diagnostic | session ID w dedupe key |
| `purchase` | Wyłącznie raport z serwerowo potwierdzoną płatnością | transaction_id, actual value, currency, plan, locale, market + zamknięty kontekst | Stripe/Supabase | **primary** | webhook + dedupe key; client local key + transaction ID |
| `full_report_viewed` | Render płatnego raportu | locale, market, plan | Supabase + GA4 | secondary | raz na mount |
| `feedback_submitted` | Zapis feedbacku płatnego raportu | locale, market, plan | Supabase | secondary | odpowiedź 2xx |
| `delete_requested` | Skuteczne żądanie usunięcia | locale, market | Supabase | diagnostic | zapis poza kasowanym FK |

`role_autodetected` i `role_autodetect_corrected` istnieją wyłącznie w GA4, więc znikają dla każdego, kto nie wyrazi zgody — a na ruchu płatnym to znaczna część. Dlatego `analysis_started` niesie do Supabase dwa dodatkowe, zamknięte pola: `role_source` (`autodetected`, `user_chose`, `not_detected`, `detector_error`, `not_run`) mówiące skąd wzięła się wartość `broad_role_enum`, oraz `detected_role_enum` — **co zaproponował detektor**, zachowywane także wtedy, gdy użytkownik jego propozycję nadpisał. Bez tego `broad_role_enum=frontend_developer` jest nierozstrzygalne: to jednocześnie odpowiedź detektora i domyślna wartość formularza, zapisywana zanim CV zostanie sparsowane. Oba pola to domknięte enumy z tej samej listy ról co `broad_role_enum`; nie zbieramy żadnej nowej danej o osobie, tylko pochodzenie wartości, którą i tak już zapisywaliśmy.

`error_category` dla `analysis_failed`: `empty_file`, `file_too_large`, `unsupported_file_type`, `invalid_file_signature`,
`invalid_file_mime`, `unsafe_archive`, `unreadable_document`, `document_too_long`, `not_a_cv`, `invalid_target_role`,
`invalid_target_seniority`, `invalid_job_description`, `rate_limit`, `verification`, `model`, `storage`, `timeout`,
`configuration`, `unknown`. `verification` (Turnstile: token brakujący, nieudany lub tymczasowo niedostępny) jest
rozdzielone od `rate_limit` (przekroczony limit) — inna przyczyna, inna reakcja właściciela. Dla `unreadable_document`
serwer dokłada `unreadable_reason` (`pdf_no_text_items`, `pdf_empty_text_items`, `pdf_page_extraction_failed`,
`pdf_parse_failed`, `pdf_encrypted`, `docx_no_text`, `docx_parse_failed`, `text_below_threshold`) i pokazuje reakcji
zgodny, konkretny komunikat PL/EN zamiast jednego ogólnego "nie udało się odczytać tekstu".

### Alert awarii konfiguracji analizy

- GA4 custom dimension: `Kategoria błędu analizy`, zakres `Zdarzenie`, parametr `error_category` — utworzona 2026-08-10.
- Docelowa reguła: co godzinę, `Platforma zawiera web`, `Kategoria błędu analizy = configuration`, `Liczba zdarzeń > 0`.
- Powiadomienie: właściciel usługi CVUnfold w GA4.
- Aktywacja reguły wymaga pojawienia się nowego wymiaru w kreatorze statystyk niestandardowych; GA4 deklaruje zwykle 24–48 godzin przetwarzania definicji. Do tego czasu źródłem operacyjnym pozostają bezpieczny log `[analysis_failed] OPENAI_AUTH_FAILED` i serwerowy `analysis_failed` w bazie.

## Purchase — jeden autorytatywny mechanizm

Stripe webhook jest źródłem prawdy. Funkcja bazodanowa atomowo weryfikuje oczekiwany analysis/plan/amount/currency, oznacza payment jako paid, odblokowuje analizę i tworzy `stripe-purchase:<checkout_session_id>`. UI wysyła GA4 `purchase` i opcjonalną bezpośrednią konwersję Ads dopiero po pobraniu tak potwierdzonego raportu oraz po gotowości consented Google tag. Do tego czasu event pozostaje w kolejce i nie jest oznaczany jako wysłany. `transaction_id` to Checkout Session ID.

Jeżeli skonfigurowano `NEXT_PUBLIC_GOOGLE_ADS_ID` oraz `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`, kod wysyła bezpośredni `conversion`. W Google Ads nie importować równolegle tego samego GA4 purchase jako drugiej primary conversion. Pozostałe eventy ustawić jako secondary/diagnostic. Referencja: [GA4 recommended purchase event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase).

## UTM i atrybucja

- Przechowujemy `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` w `sessionStorage`, następnie w allowlistowanym rekordzie analizy.
- Po zgodzie publiczny `page_location` zachowuje wyłącznie zwalidowane UTM i identyfikatory kliknięcia, a GA4 otrzymuje także standardowe pola `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` i `campaign_term`. Pozostałe parametry URL są odcinane.
- `gclid`, `gbraid`, `wbraid` nie są własnymi parametrami eventów i nigdy nie trafiają do linku handoffu, linku raportu ani prywatnego `page_location`.
- `analyses.attribution` zawiera zamknięty kontekst `landing_variant=developer`, rolę, seniority i opcjonalny `handoff_origin`. Nie zawiera nazwy pliku, treści CV, dostawcy pliku ani prywatnego URL-a.
- Diagnostics łączy zakupy z bezpiecznym `attribution.source`; wydatki Ads są łączone później poza aplikacją.
- Link handoffu nie kopiuje bieżącego query stringa. Zachowuje wyłącznie rolę, seniority, plan i `handoff=mobile`; nie zawiera źródła kampanii, CV, ogłoszenia, nazwy pliku, tokenu, click ID ani szczegółowych UTM.
- Diagnostics agreguje analizy i zakupy według wariantu, roli, seniority i planu; wartości historyczne bez kontekstu są oznaczone jako `legacy_unknown`.

## Anonimowe dopasowanie odbiorców

- Źródło prawdy: trigger `anonymous_role_aggregate_after_insert` na zapisanym, zwalidowanym raporcie.
- Klasyfikacja korzysta przejściowo wyłącznie z `report.document.perceivedRole`; surowa wartość nie jest kopiowana do statystyk.
- Migracja agreguje również raporty pozostające jeszcze w 30-dniowej retencji, bez utrwalenia ich identyfikatorów.
- Usunięcie lub wygaśnięcie raportu nie zmniejsza skumulowanego anonimowego licznika.
- Admin diagnostics pokazuje kategorie dopiero od pięciu analiz; małe komórki zwraca wyłącznie jako sumę ukrytą.

## Lejek niezależny od zgody

GA4 widzi wyłącznie osoby, które zaakceptowały cookies analityczne: `gtag.js` wstrzykuje się
dopiero po wyborze „Zgadzam się”, a domyślny consent state to `denied` bez pingów. Każda liczba
z GA jest więc zaniżona o nieznany współczynnik zgód i nie nadaje się do oceny skuteczności
reklam ani wielkości lejka.

Autorytatywne liczby są w tabeli `funnel_events`, zapisywanej po stronie serwera, bez cookies,
identyfikatorów i danych osobowych. Każdy nowy zapis ma osobną, serwerową etykietę
`runtime_environment` (`production`, `preview` albo `development`); wpisy sprzed tej zmiany pozostają
`legacy_unknown` i nie mogą być uznawane za produkcyjne. `upload-flow` dokleja do żądania analizy atrybucję z
`sessionStorage`, więc `source`, `medium` i `campaign` mamy również dla osób, które zgody nie
wyraziły.

```bash
ADMIN_SECRET=… FUNNEL_BASE_URL=https://cvunfold.com pnpm funnel --days 7 --environment production
```

Skrypt czyta `GET /api/admin/diagnostics?days=N&environment=production` (1–90, domyślnie 1) i drukuje lejek, wskaźniki
konwersji, podział ruchu według `source`/`medium` oraz przyczyny nieudanych analiz. Porównanie
`analysis_started` z tego raportu z `upload_started` w GA4 daje współczynnik zgód — mnożnik,
przez który trzeba czytać cały panel GA.

Skrypt kończy się kodem 2, gdy odpytany deployment nie ma skonfigurowanej Supabase: odpowiada
wtedy ze store'u w pamięci, którego zera oznaczają brak bazy, a nie brak ruchu.

## QA

1. GA4 DebugView: zgoda denied — brak tagu/requestów; accepted — eventy bez PII.
2. Tag Assistant: cztery domyślne consent states denied i poprawny update po wyborze.
3. Network: żadnego tokenu raportu w `page_location`, refererze ani payloadzie.
4. Stripe sandbox: jeden Checkout, retry webhooka i trzy powroty do raportu dają jeden purchase transaction_id.
5. Google Ads: direct conversion ma realną wartość/walutę; purchase jest jedyną primary.
6. Report CTA: desktop sidebar, mobile summary, mobile sticky i końcowy paywall raportują wyłącznie allowlistowane `purchase_surface`; widok slotu walleta ma `payment_method=express_wallet`, a wybór jest odróżniony przez `apple_pay` lub `google_pay`, bez danych walleta lub karty.
