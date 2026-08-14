# Hipoteza odbiorcy i wariantu landingu

## Wariant aktywny

Aktywny wariant jest zamkniętym enumem `landing_variant="developer"`. Landing komunikuje diagnozę CV zoptymalizowaną dla ról technicznych: Frontend, Backend, Full-stack, Mobile, QA / Test Automation i DevOps / Platform. Frontend ma najgłębszą dotychczasową walidację semantyczną; pozostałe role mają rubryki i syntetyczne przypadki przekrojowe, ale nie równoważny materiał live-model. Formularz udostępnia dodatkowo zamkniętą opcję `other` jako wyraźnie eksperymentalną analizę według kryteriów ogólnych. Nie zbieramy tekstowej nazwy innego zawodu i nie przedstawiamy tego trybu jako równoważnego wsparcia.

Wariant „specjaliści IT” pozostaje poza sprintem. Nie zmieniamy jednocześnie odbiorcy, reklam, ceny i modelu analizy.

## Hipoteza

Developer, który ma doświadczenie, ale nie wie, jaki poziom komunikuje dokument, zapłaci za diagnozę opartą na dowodach i priorytetach przed rozpoczęciem redakcji. Własny agent AI może następnie pomóc w redakcji; CV Unfold odpowiada za rubrykę roli, dowody, priorytety i kontrolę faktów.

Hipotezę wspierają dopiero:

- poprawnie zmierzony zakup;
- koszt pozyskania zakupu;
- marża po VAT, Stripe, AI i zwrotach;
- jakość raportu i feedback użytkownika;
- stabilny technicznie lejek z podziałem na urządzenie, rolę, seniority, plan i handoff.

CTR i upload nie potwierdzają gotowości do zapłaty.

## Kontekst pomiarowy

Każda nowa analiza zapisuje w `analyses.attribution` wyłącznie zamknięty kontekst:

- `landing_variant`;
- `broad_role_enum`;
- `selected_seniority_enum`;
- opcjonalny `handoff_origin` (`google_cpc` albo `other`);
- istniejącą, bezpieczną atrybucję kampanii.

Treść CV, ogłoszenia, raportu, nazwa pliku i token nie trafiają do pomiaru. Link handoffu zachowuje tylko rolę, seniority, wybrany plan i znacznik `handoff=mobile`; nie przenosi źródła kampanii ani identyfikatora kliknięcia.

## Warunek testu wariantów

Produkcyjny A/B test zaczyna się dopiero po minimum 500 sesjach i 30 zakupach na wariant oraz trwa co najmniej 14 dni. Podstawowym wynikiem jest zakup i marża, nie CTR. Test zostaje przerwany przy niepoprawnym Purchase, błędzie płatnego odblokowania albo istotnym pogorszeniu jakości analizy.
