# Measurement plan

## Zasada

Google dostaje wyłącznie parametry z zamkniętej allowlisty. Treść CV, ogłoszenia, raportu, promptu, błędu modelu, nazwa pliku, dane kontaktowe, token i prywatny URL są zabronione. Na stronie raportu tag może zostać załadowany dopiero po zgodzie, ale otrzymuje wyłącznie zanonimizowaną lokalizację `/raport` lub `/en/report`, bez automatycznego `page_view`. Pozwala to wysłać potwierdzony `purchase` bez ujawniania prywatnego URL-a. W formularzu i teaserze nie instalujemy session replay ani heatmap.

Consent Mode v2 ma domyślnie cztery stany `denied`; tag jest ładowany dopiero po świadomej zgodzie. Użytkownik ma równorzędne opcje akceptacji, odrzucenia i późniejszej zmiany ustawień. Implementacja odpowiada [aktualnej instrukcji Google](https://developers.google.com/tag-platform/security/guides/consent).

## Eventy

| Event | Moment | Parametry allowlist | Źródło prawdy | Ads | Deduplikacja / test |
|---|---|---|---|---|---|
| `landing_view` | Render `/` lub `/en` po zgodzie | locale, market, UTM | GA4 | secondary | raz na page view; DebugView |
| `hero_cta_clicked` | CTA hero/cennik/final | locale, market, placement, UTM | GA4 | secondary | kliknięcie; DebugView |
| `sample_report_viewed` | Render syntetycznego raportu | locale, market, plan | GA4 | secondary | raz na mount; DebugView |
| `pricing_viewed` | Pierwsze wejście cennika w viewport | locale, market, UTM | GA4 | secondary | `IntersectionObserver` disconnect |
| `upload_started` | Wybór poprawnego pliku | locale, market, plan, role enum, seniority enum, UTM | GA4 | secondary | jedno wybranie pliku |
| `upload_completed` | Serwer przyjął i przetworzył upload | jw. | GA4 | secondary | odpowiedź sukcesu API |
| `analysis_started` | Submit oraz bezpieczny event serwerowy | jw.; DB: plan + UTM | GA4 + Supabase | secondary | systemy raportowane oddzielnie |
| `analysis_succeeded` | Walidowany raport zapisany | client: plan/success; server: czas/model/wersje/tokeny/koszt | Supabase | secondary | jeden zapis na analizę |
| `analysis_failed` | Bezpieczna kategoria błędu | locale, market, plan, error_category | Supabase + GA4 | diagnostic | bez raw exception |
| `teaser_viewed` | Render nieopłaconego teasera | locale, market, plan | GA4 + Supabase | secondary | raz na mount |
| `checkout_started` | Utworzona sesja Checkout | locale, market, plan | Supabase | secondary | zdarzenie po serwerowym utworzeniu |
| `checkout_cancelled` | Powrót użytkownika z anulowanego Checkout | locale, market, plan | GA4 + Supabase | diagnostic | raz na analizę; cookie raportu + dedupe key |
| `checkout_expired` | Podpisany webhook `checkout.session.expired` | locale, market, plan | Stripe/Supabase | diagnostic | session ID w dedupe key |
| `payment_failed` | Podpisany webhook `checkout.session.async_payment_failed` | locale, market, plan | Stripe/Supabase | diagnostic | session ID w dedupe key |
| `purchase` | Wyłącznie raport z serwerowo potwierdzoną płatnością | transaction_id, actual value, currency, plan, locale, market | Stripe/Supabase | **primary** | webhook + dedupe key; client local key + transaction ID |
| `full_report_viewed` | Render płatnego raportu | locale, market, plan | Supabase + GA4 | secondary | raz na mount |
| `feedback_submitted` | Zapis feedbacku płatnego raportu | locale, market, plan | Supabase | secondary | odpowiedź 2xx |
| `delete_requested` | Skuteczne żądanie usunięcia | locale, market | Supabase | diagnostic | zapis poza kasowanym FK |

## Purchase — jeden autorytatywny mechanizm

Stripe webhook jest źródłem prawdy. Funkcja bazodanowa atomowo weryfikuje oczekiwany analysis/plan/amount/currency, oznacza payment jako paid, odblokowuje analizę i tworzy `stripe-purchase:<checkout_session_id>`. UI wysyła GA4 `purchase` i opcjonalną bezpośrednią konwersję Ads dopiero po pobraniu tak potwierdzonego raportu oraz po gotowości consented Google tag. Do tego czasu event pozostaje w kolejce i nie jest oznaczany jako wysłany. `transaction_id` to Checkout Session ID.

Jeżeli skonfigurowano `NEXT_PUBLIC_GOOGLE_ADS_ID` oraz `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`, kod wysyła bezpośredni `conversion`. W Google Ads nie importować równolegle tego samego GA4 purchase jako drugiej primary conversion. Pozostałe eventy ustawić jako secondary/diagnostic. Referencja: [GA4 recommended purchase event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase).

## UTM i atrybucja

- Przechowujemy `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` w `sessionStorage`, następnie w allowlistowanym rekordzie analizy.
- `gclid`, `gbraid`, `wbraid` mogą być zachowane do przyszłej zgodnej integracji, ale obecnie nie są wysyłane jako parametry eventów i nigdy nie trafiają do linku raportu.
- Diagnostics łączy zakupy z bezpiecznym `attribution.source`; wydatki Ads są łączone później poza aplikacją.

## QA

1. GA4 DebugView: zgoda denied — brak tagu/requestów; accepted — eventy bez PII.
2. Tag Assistant: cztery domyślne consent states denied i poprawny update po wyborze.
3. Network: żadnego tokenu raportu w `page_location`, refererze ani payloadzie.
4. Stripe sandbox: jeden Checkout, retry webhooka i trzy powroty do raportu dają jeden purchase transaction_id.
5. Google Ads: direct conversion ma realną wartość/walutę; purchase jest jedyną primary.
