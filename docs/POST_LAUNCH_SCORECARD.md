# Post-launch scorecard

## Snapshot startowy

Snapshot przekazany przez właściciela 2026-08-13. To punkt odniesienia do dalszego pomiaru, nie bieżący odczyt API Google Ads.

| Metryka | Wartość |
|---|---:|
| Wyświetlenia | 60 |
| Kliknięcia | 5 |
| CTR | 8,33% |
| Średni CPC | 3,35 zł |
| Koszt | 16,74 zł |
| Udział mobile w koszcie | 86,9% |

Pięć kliknięć może wskazywać, że reklama budzi zainteresowanie, ale nie pozwala jeszcze ocenić opłacalności ani jakości kupujących.

## Snapshot przed naprawą atrybucji — 13 sierpnia 2026

| Metryka | Wartość |
|---|---:|
| Wyświetlenia | 129 |
| Kliknięcia | 12 |
| CTR | 9,30% |
| Średni CPC | 3,69 zł |
| Koszt | 44,24 zł |
| Raportowane konwersje | 0 |

Kampania nie miała ustawionych opcji adresu URL, a aplikacja usuwała parametry kampanii z `page_location` GA4. Suffix UTM przeszedł test strony docelowej i został zapisany 13 sierpnia 2026. Poprawka dotyczy nowych kliknięć; historycznych sesji oznaczonych jako direct nie należy retroaktywnie przypisywać do kampanii.

## Próg brutto i rzeczywista marża

Przy średnim CPC 3,35 zł sam przychód brutto pokrywa reklamę w przybliżeniu przy:

- raporcie za 29 zł: konwersja 11,55%, czyli około jeden zakup na 9 kliknięć;
- raporcie za 39 zł: konwersja 8,59%, czyli około jeden zakup na 12 kliknięć.

To nie jest próg rentowności. Marżę kontrybucyjną liczymy dopiero po odjęciu VAT, opłat Stripe, kosztu AI, zwrotów oraz kosztu reklam. Źródłem prawdy dla zakupu jest serwerowo potwierdzona płatność Stripe, nie kliknięcie CTA ani rozpoczęcie Checkout.

## Punkty kontrolne

| Moment | Decyzja i sprawdzane sygnały |
|---|---|
| 20–30 płatnych kliknięć | Zapytania, CTR, CPC, urządzenia oraz techniczny lejek: landing → picker → upload → analiza → teaser → Checkout. Bez wniosków o rentowności. |
| 30–50 płatnych kliknięć | Pierwszy sygnał zakupowy i poprawność pomiaru `purchase`. |
| 50 poprawnie zmierzonych kliknięć | Zero zakupów blokuje skalowanie. Najpierw diagnoza zapytań, urządzeń, uploadu, analizy i Checkout. |
| ≥100 płatnych kliknięć i ≥10 zakupów | Skalowanie jest dopuszczalne wyłącznie przy dodatniej marży kontrybucyjnej. |
| A/B | Dopiero od 500 sesji i 30 zakupów na wariant, przez minimum 14 dni. |

Podniesienie budżetu pozostaje zablokowane do czasu produkcyjnego zakupu, który odblokuje raport i wygeneruje dokładnie jedną konwersję Purchase.

## Mobile i wybór pliku

Obserwujemy osobno:

1. `file_picker_opened`;
2. `file_picker_cancelled` tylko z natywnego zdarzenia `cancel`;
3. `upload_started` z `upload_entrypoint=picker|drop`;
4. `desktop_handoff_started` i `desktop_handoff_completed`;
5. `handoff_link_opened` na urządzeniu docelowym.

Nie rozpoznajemy ani nie raportujemy dostawcy pliku. Pełny Google Picker pozostaje poza sprintem. Wracamy do decyzji po co najmniej 50 mobilnych otwarciach selektora, jeżeli wybór pliku następuje w mniej niż 60% przypadków albo wynik jest o co najmniej 20 punktów procentowych słabszy niż na desktopie.

## Reguła interpretacji

CTR, otwarcie pickera, upload i wygenerowanie teasera są sygnałami diagnostycznymi. Nie są substytutem zakupu, CAC ani marży. Każdą decyzję o skalowaniu zapisujemy wraz z zakresem danych, okresem i stanem jakości pomiaru.

## Lejek do odczytu

`landing_view → file_picker_opened → upload_started → analysis_succeeded → teaser_viewed → checkout_started → purchase`

Interpretujemy pierwszy istotny spadek, a nie samą liczbę odwiedzin. Przykładowo: dużo otwarć selektora i mało `upload_started` wskazuje tarcie przy wyborze pliku; dużo teaserów i brak checkoutu wskazuje raczej problem wartości raportu lub oferty.
