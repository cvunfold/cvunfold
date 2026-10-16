import type { Article } from "./article-types";

export const frontendCvPl: Article = {
  "intro": "W CV frontend developera pokaż, co zbudowałeś, za którą część odpowiadałeś i jak sprawdziłeś jej działanie. React i TypeScript należą do stacku. Dopiero opis formularza, integracji albo komponentu wyjaśnia, jak używałeś ich w pracy.",
  "openingParagraphs": [
    "Poniżej znajdziesz całe przykładowe CV, a następnie omówienie podsumowania, technologii i opisów doświadczenia. Możesz potraktować je jako punkt odniesienia dla własnego dokumentu.",
    "Marta Zielińska, firmy, projekty i wszystkie dane w przykładzie są fikcyjne. To ilustracja redakcyjna, nie CV klientki ani wynik rekrutacji. Adresy w domenie example.com są miejscami na własne, działające linki. Do swojego CV przenieś tylko informacje zgodne z Twoją pracą."
  ],
  "sections": [
    {
      "heading": "Przykładowe CV frontend developera",
      "paragraphs": [],
      "blocks": [
        {
          "type": "heading",
          "text": "Marta Zielińska"
        },
        {
          "type": "paragraph",
          "text": "Frontend Developer · React i TypeScript"
        },
        {
          "type": "paragraph",
          "text": "Warszawa · marta.zielinska@example.com"
        },
        {
          "type": "paragraph",
          "text": "Portfolio: https://example.com/portfolio"
        },
        {
          "type": "paragraph",
          "text": "GitHub: https://example.com/github"
        },
        {
          "type": "heading",
          "text": "Podsumowanie"
        },
        {
          "type": "paragraph",
          "text": "Frontend developerka z doświadczeniem w aplikacjach React i TypeScript dla zespołów obsługi zamówień. Pracowałam nad formularzami, integracją z REST API i współdzielonymi komponentami. W ostatniej roli odpowiadałam za interfejs edycji zamówienia: walidację, obsługę błędów zapisu i testy najważniejszych ścieżek."
        },
        {
          "type": "heading",
          "text": "Umiejętności"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Interfejsy: React, TypeScript, JavaScript, HTML, CSS.",
            "Dane: REST API, TanStack Query; stany ładowania, błędu i ponowienia żądania.",
            "Testy: React Testing Library, Vitest, Playwright.",
            "Komponenty: Storybook; dokumentowanie stanów i zachowania przy obsłudze klawiaturą.",
            "Praca zespołowa: Git, code review i uzgadnianie kontraktu API z backendem."
          ]
        },
        {
          "type": "heading",
          "text": "Doświadczenie zawodowe"
        },
        {
          "type": "paragraph",
          "text": "Frontend Developer · Northleaf Tools"
        },
        {
          "type": "paragraph",
          "text": "03.2023 do 09.2026 · aplikacja do obsługi zamówień"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Zaimplementowałam edycję zamówienia w React i TypeScript. Dodałam walidację pól oraz zachowanie wpisanych danych po nieudanym zapisie.",
            "Uzgodniłam z backendem format błędów API. W interfejsie rozdzieliłam błędy konkretnego pola od problemu z całym żądaniem i dodałam możliwość ponowienia zapisu. Pobieranie i odświeżanie danych zamówienia obsłużyłam przez TanStack Query.",
            "Wydzieliłam współdzielony komponent wyboru terminu. Dodałam nawigację klawiaturą, przywracanie fokusu po zamknięciu oraz przykłady stanów w Storybooku.",
            "Napisałam testy walidacji w Vitest i React Testing Library. W Playwright sprawdziłam zapis poprawnego zamówienia, błąd API i ponowienie żądania.",
            "W przeglądach kodu sprawdzałam obsługę pustych danych, błędów i stanów ładowania. Zgłaszałam uwagi z krokami odtworzenia problemu."
          ]
        },
        {
          "type": "paragraph",
          "text": "Junior Frontend Developer · Cedar Labs"
        },
        {
          "type": "paragraph",
          "text": "08.2021 do 02.2023 · panel administracyjny"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Rozwijałam widoki list i szczegółów w React. Połączyłam filtrowanie oraz paginację z REST API, korzystając z uzgodnionego kontraktu danych.",
            "Dodałam osobne widoki braku wyników, ładowania i błędu żądania, żeby panel wyjaśniał użytkownikowi bieżący stan operacji.",
            "Poprawiłam formularz zaproszenia użytkownika: powiązałam etykiety z polami i dodałam tekstowe komunikaty błędów. Sprawdzałam przejście po formularzu klawiaturą."
          ]
        },
        {
          "type": "heading",
          "text": "Projekt własny"
        },
        {
          "type": "paragraph",
          "text": "Session Notes · aplikacja do notatek ze spotkań"
        },
        {
          "type": "paragraph",
          "text": "React, TypeScript, lokalny zapis w przeglądarce"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Zaprojektowałam dodawanie i edycję notatek, oznaczanie zadań oraz filtrowanie po statusie.",
            "Dodałam eksport i import JSON oraz walidację struktury importowanych danych. Niepoprawny import nie zastępuje zapisanych notatek.",
            "W README opisałam uruchomienie, zakres projektu i ograniczenia lokalnego przechowywania. Repozytorium: https://example.com/session-notes"
          ]
        },
        {
          "type": "heading",
          "text": "Wykształcenie"
        },
        {
          "type": "paragraph",
          "text": "Informatyka, studia inżynierskie · fikcyjna uczelnia · 2017 do 2021"
        },
        {
          "type": "heading",
          "text": "Języki"
        },
        {
          "type": "paragraph",
          "text": "Polski: ojczysty. Angielski: B2; praca z dokumentacją i udział w przeglądach kodu."
        }
      ]
    },
    {
      "heading": "Dlaczego podsumowanie mówi o formularzu?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Podsumowanie wybiera jeden fragment doświadczenia i zapowiada to, co da się znaleźć niżej. Czytelnik widzi rolę, środowisko pracy i konkretny zakres. Nie musi zgadywać, co oznacza „rozwój nowoczesnych rozwiązań”."
        },
        {
          "type": "paragraph",
          "text": "Nie przepisuj całego przykładu tylko dlatego, że korzystasz z podobnego stacku. Jeśli pracowałeś głównie przy serwisach treściowych, opisz ten kontekst. Jeśli utrzymywałeś bibliotekę komponentów, pokaż jej zastosowanie i swoją rolę. Podsumowanie powinno wynikać z Twojego doświadczenia."
        },
        {
          "type": "paragraph",
          "text": "Przy ofercie dotyczącej formularzy Marta zostawiłaby takie otwarcie. Przy roli związanej z biblioteką komponentów mogłaby wyeksponować komponent wyboru terminu, Storybook i obsługę klawiatury. Oba warianty mają podstawę w tym samym CV."
        }
      ]
    },
    {
      "heading": "Stack połączony z doświadczeniem",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Lista technologii pozwala szybko zobaczyć narzędzia, z których korzystasz. Nie rozstrzyga jednak, jak dobrze je znasz. Dlatego w przykładzie React, testy i Storybook mają również zastosowanie opisane przy konkretnym stanowisku."
        },
        {
          "type": "paragraph",
          "text": "Pogrupuj technologie według zadania, jeśli dzięki temu lista staje się czytelniejsza. Nie musisz kopiować kategorii z tego CV. Dla osoby pracującej nad aplikacjami Next.js istotne mogą być również rendering, routing i sposób pobierania danych. Wpisz je wtedy, gdy potrafisz opisać swoją pracę w tych obszarach."
        },
        {
          "type": "paragraph",
          "text": "Gwiazdek ani procentów znajomości nie ma w przykładzie. To wybór redakcyjny: opis użycia narzędzia jest łatwiejszy do omówienia niż „TypeScript 90%”. Więcej o łączeniu umiejętności z dowodami znajdziesz w poradniku o wiarygodności technicznej."
        }
      ],
      "links": [
        {
          "label": "wiarygodności technicznej",
          "href": "/artykuly/wiarygodnosc-techniczna-w-cv"
        }
      ]
    },
    {
      "heading": "Opis projektu powinien wyjaśniać Twoją pracę",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Porównaj dwa opisy tego samego fragmentu z fikcyjnego CV:"
        },
        {
          "type": "paragraph",
          "text": "Przed: „Rozwój aplikacji w React. Integracja z API. Dbanie o jakość kodu.”"
        },
        {
          "type": "paragraph",
          "text": "Po: „Zaimplementowałam edycję zamówienia w React i TypeScript. Dodałam walidację pól oraz zachowanie wpisanych danych po nieudanym zapisie. Napisałam testy poprawnego zapisu, błędu API i ponowienia żądania.”"
        },
        {
          "type": "paragraph",
          "text": "Druga wersja podaje funkcję, zachowanie po błędzie i sposób sprawdzenia. Daje też temat do rozmowy: dlaczego dane trzeba było zachować, jak rozróżniono błędy i co obejmowały testy?"
        },
        {
          "type": "paragraph",
          "text": "Nie ma tu procentowego wzrostu ani liczby użytkowników. Brak pomiaru nie wymaga wymyślania wyniku. Jeżeli rzeczywiście zmierzyłeś zmianę wydajności, podaj wynik i warunki porównania: widok, rodzaj testu i sposób pomiaru. Wynik testu lokalnego nie powinien udawać danych z ruchu produkcyjnego."
        },
        {
          "type": "paragraph",
          "text": "Nie każdy punkt musi być rozbudowanym osiągnięciem. Zdanie o code review opisuje odpowiedzialność i jej zakres. Gdy kilka punktów mówi tylko o współpracy, zostaw najważniejsze, a odzyskane miejsce przeznacz na konkretny przykład działania."
        }
      ]
    },
    {
      "heading": "Co zmienić, jeśli dopiero szukasz pierwszej pracy?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Nie przejmuj stanowisk z przykładu. W sekcji projektów opisz aplikacje z kursu, studiów lub własnej pracy i zaznacz ich pochodzenie. Zamiast doświadczenia komercyjnego pokaż funkcję, własny wkład i sposób sprawdzenia."
        },
        {
          "type": "paragraph",
          "text": "Przykład ilustracyjny: „Projekt kursowy: panel z listą zadań w React. Po zakończeniu kursu dodałem import JSON i walidację danych. Przy niepoprawnym pliku aplikacja pokazuje błąd i zachowuje dotychczasową listę.”"
        },
        {
          "type": "paragraph",
          "text": "To opisuje mniejszy zakres niż odpowiedzialność za produkt komercyjny, ale daje konkretną informację. Rozwiń go tylko o działania, które naprawdę wykonałeś. Więcej przykładów znajdziesz w poradniku o CV bez doświadczenia w IT."
        }
      ],
      "links": [
        {
          "label": "CV bez doświadczenia w IT",
          "href": "/artykuly/cv-bez-doswiadczenia-w-it"
        }
      ]
    },
    {
      "heading": "Sprawdź dokument po eksporcie",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Przeczytaj CV w pliku, który wyślesz. Sprawdź, czy daty należą do właściwych stanowisk, linki prowadzą do wybranych projektów, a tekst daje się skopiować w logicznej kolejności. Nie ściskaj opisów tylko po to, żeby zmieścić wszystko na jednej stronie. Decyzję o długości oprzyj na tym, co każda sekcja wnosi do aplikacji."
        },
        {
          "type": "paragraph",
          "text": "Dobrym następnym krokiem jest sprawdzenie jednego własnego opisu: czy wiadomo, co zrobiłeś, jaki miałeś zakres i jak sprawdziłeś efekt? Możesz porównać go z przykładowym raportem CVUnfold albo przesłać swoje CV do analizy. Bezpłatny wynik daje jedną poprawkę z cytatem, od której możesz zacząć redakcję."
        }
      ],
      "links": [
        {
          "label": "przykładowym raportem CVUnfold",
          "href": "/przykladowy-raport"
        },
        {
          "label": "przesłać swoje CV do analizy",
          "href": "/"
        }
      ]
    }
  ],
  "checklist": [],
  "slug": "cv-frontend-developera-przyklad",
  "category": "CV programisty",
  "publicationStatus": "draft",
  "title": "CV frontend developera: przykład i opisy projektów",
  "description": "Zobacz fikcyjne CV frontend developera i omówienie podsumowania, stacku oraz projektów. Konkretne przykłady bez dopisywania osiągnięć.",
  "excerpt": "Pełne fikcyjne CV: podsumowanie, stack i opisy pracy. Zobacz, jak wybrać informacje i pokazać własny wkład.",
  "readingTime": "6 min"
};
