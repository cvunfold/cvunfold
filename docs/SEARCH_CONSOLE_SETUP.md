# Search Console setup

Status 2026-08-10: właściwość URL-prefix `https://cvunfold.com/` jest
zweryfikowana przez metatag, a właściwość domenowa `cvunfold.com` przez rekord
TXT w OVH. `https://cvunfold.com/sitemap.xml` ma status **Sukces** i 30
wykrytych adresów również w widoku domenowym.

## Stan techniczny

- Główny host to `cvunfold.com`; `.pl` i oba warianty `www` przekierowują 308 do `.com`.
- Polski jest domyślny: `/`; angielski: `/en`.
- Legacy `/pl/*` przekierowuje 308 do kanonicznych polskich URL-i.
- Obie wersje mają własne title, description, canonical, alternates, OG, artykuły i RSS.
- `/analiza`, `/raport`, `/en/analysis`, `/en/report`, API i legacy prywatne ścieżki mają `noindex`; nie występują w sitemap.
- `/sitemap.xml` zawiera tylko publiczne strony i artykuły PL/EN.
- `/robots.txt` wskazuje sitemap i blokuje prywatne flow.
- Nie ma fake reviews, ratingów ani niepotwierdzonych statystyk w structured data.

## Weryfikacja domeny

1. Właściwość URL-prefix `https://cvunfold.com/` jest zweryfikowana przez `GOOGLE_SITE_VERIFICATION`.
2. Właściwość domenowa `cvunfold.com` jest zweryfikowana przez rekord TXT u dostawcy DNS.
3. Nie usuwaj metatagu ani rekordu TXT — utrzymują obie niezależne metody weryfikacji.
4. Sitemap została już przesłana. Nie przesyłaj jej ponownie, chyba że Search Console zgłosi błąd.

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
