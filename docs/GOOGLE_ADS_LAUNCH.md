# Google Ads launch pack

Nie uruchamiać kampanii przed działającym purchase trackingiem, Stripe live smoke testem, live-model evalem i akceptacją dokumentów. Nie wydawać pieniędzy bez decyzji właściciela.

## Pierwszy test

- Typ: Google Search only.
- Lokalizacja: Polska; język polski.
- Search Partners: off.
- Display: off.
- Performance Max: nie na start.
- Budżet: niski, diagnostyczny, ustawiony przez właściciela.
- Purchase: jedyna primary conversion; pozostałe eventy secondary/diagnostic.

## Grupy reklam

### A. CV developera

`[cv programisty]`, `[analiza cv programisty]`, `[ocena cv programisty]`, `"jak poprawić cv developera"`, `"cv frontend developer"`.

### B. Seniority

`"cv senior developer"`, `"cv senior frontend"`, `"jak pokazać seniority w cv"`, `"cv na seniora"`, `"czy moje cv wygląda na seniora"`.

### C. Generyczna analiza CV

`[sprawdź moje cv]`, `[analiza cv]`, `[ocena cv]`. Mniejszy początkowy budżet; ta intencja silnie konkuruje z darmowymi checkerami.

## Negatywne słowa

Na start jako phrase/exact po sprawdzeniu dopasowań: `darmowe`, `za darmo`, `wzór`, `szablon`, `generator`, `kreator`, `word`, `europass`, `pobierz`, `do skopiowania`, `praca domowa`, `definicja`. Nie blokuj słowa „przykład” globalnie — użytkownik szukający przykładu dobrego CV może nadal mieć wartościową intencję.

## Responsive Search Ad — propozycje

Nagłówki mieszczące się w typowym limicie 30 znaków:

- Czy CV wygląda na Seniora?
- Analiza CV dla Developerów
- Pierwsze 20 Sekund CV
- Nie Kolejny ATS Checker
- Każda Uwaga z Dowodem
- Pokaż Ownership i Wpływ
- Bez Konta i Abonamentu
- Pełna Analiza od 29 zł
- Masz Doświadczenie. Widać?

Opisy mieszczące się w typowym limicie 90 znaków:

- Zobacz seniority, ownership i pierwsze wrażenie. Każda ważna uwaga ma dowód.
- ATS sprawdza format. My pokazujemy, co hiring manager zrozumie z Twojego CV.
- Darmowy wynik wstępny. Pełny raport od 29 zł. Bez konta i bez subskrypcji.
- Nie dopisujemy osiągnięć. Pokazujemy, które doświadczenia są źle wyeksponowane.

Nie używać gwarancji pracy, skuteczności procentowej, mnożników rozmów ani „najlepszy w Polsce”.

## UTM

Final URL suffix:

`utm_source=google&utm_medium=cpc&utm_campaign=cv_developer_pl_search&utm_content={adgroupid}-{creative}&utm_term={keyword}`

Nazwy kampanii/grup nie mogą zawierać danych użytkownika. Nie przenosić UTM/gclid do linku raportu.

## Kontrolny launch

1. Przed startem wykonaj sandbox i jedną prawdziwą płatność za zgodą właściciela.
2. Przez pierwsze 60 minut obserwuj błędy analizy, webhook i purchase.
3. Codziennie sprawdzaj Search Terms, realny przychód i AI cost według source.
4. Zatrzymaj kampanię natychmiast, gdy purchase nie jest raportowany, płatność nie odblokowuje raportu albo failure rate rośnie nietypowo.
5. Po około 250 zł dodaj ewidentne negatywne frazy; nie zmieniaj jednocześnie landingu, promptu, stawek i reklam.

