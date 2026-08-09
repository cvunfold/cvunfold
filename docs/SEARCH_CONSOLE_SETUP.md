# Search Console setup

## Stan techniczny

- Polski jest domyślny: `/`; angielski: `/en`.
- Legacy `/pl/*` przekierowuje 308 do kanonicznych polskich URL-i.
- Obie wersje mają własne title, description, canonical, alternates, OG, artykuły i RSS.
- `/analiza`, `/raport`, `/en/analysis`, `/en/report`, API i legacy prywatne ścieżki mają `noindex`; nie występują w sitemap.
- `/sitemap.xml` zawiera tylko publiczne strony i artykuły PL/EN.
- `/robots.txt` wskazuje sitemap i blokuje prywatne flow.
- Nie ma fake reviews, ratingów ani niepotwierdzonych statystyk w structured data.

## Weryfikacja domeny

1. W Search Console wybierz **Domain property** dla bieżącej domeny produktu.
2. Dodaj otrzymany rekord TXT w DNS domeny. To jest operacja właściciela i wymaga potwierdzenia właściwego konta, domeny i środowiska CVUnfold.
3. Alternatywnie ustaw `GOOGLE_SITE_VERIFICATION` i wdroż meta verification, ale Domain property nadal lepiej obejmuje protokoły i subdomeny.
4. Po weryfikacji prześlij `https://<domena>/sitemap.xml`.

## Kontrola po deployu

1. URL Inspection dla `/`, `/en`, przykładowego raportu i po jednym artykule PL/EN.
2. Sprawdź **user-declared canonical** oraz **Google-selected canonical**.
3. Sprawdź redirect: HTTP → HTTPS, `www` → wybrany host, `/pl` → `/`, jedna polityka trailing slash.
4. Sprawdź 404 i 500 oraz social preview `/opengraph-image`.
5. URL Inspection dla `/raport` i `/analiza`: oczekiwane `noindex`/X-Robots-Tag; nie proś o indeksowanie.
6. Po zmianie nazwy ustaw env marki, wygeneruj nowy deploy, sprawdź OG/title/structured data, a dopiero potem ewentualnie zmień domenę i przygotuj mapę 301.

## Monitoring

- Co tydzień: Pages/Indexing, canonical conflicts, sitemap errors, Core Web Vitals.
- Po zmianie marki lub domeny: nie kasuj starych URL-i; utrzymuj trwałe 301 i zaktualizuj sitemap/canonical/OG.
- Nie twórz hreflang ani alternates dla języka, którego pełna strona faktycznie nie istnieje. Obecnie PL i EN istnieją.

