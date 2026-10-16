import type { Article } from "./article-types";

export const atsGuidePl: Pick<Article, "title" | "description" | "excerpt" | "readingTime" | "intro" | "openingParagraphs" | "sections" | "checklist"> = {
  "intro": "Sprawdzenie CV pod ATS zacznij od dwóch rzeczy: czy z pliku da się odczytać tekst w sensownej kolejności oraz czy wymagania oferty mają w nim potwierdzenie. Nazwy technologii pomagają znaleźć informację. Opis Twojej pracy pozwala zrozumieć, co za nimi stoi.",
  "openingParagraphs": [
    "Zrób tę kontrolę na dokumencie, który zamierzasz wysłać. Sam wysoki wynik w narzędziu do analizy CV nie mówi jeszcze, jak aplikację oceni konkretny pracodawca."
  ],
  "sections": [
    {
      "heading": "Najpierw sprawdź, co da się odczytać z PDF",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Otwórz CV, zaznacz tekst i wklej go do prostego edytora, bez formatowania. Jeśli nie da się zaznaczyć tekstu, dokument może być zapisany jako obraz. Eksportuj go ponownie z programu, w którym powstał, zamiast robić zrzut ekranu."
        },
        {
          "type": "paragraph",
          "text": "Przeczytaj wklejoną treść od góry. Sprawdź:"
        },
        {
          "type": "list",
          "ordered": true,
          "items": [
            "Czy nazwa stanowiska, firma i daty nadal należą do tego samego wpisu?",
            "Czy punkty opisujące pracę pojawiają się pod właściwym stanowiskiem?",
            "Czy kontakt, umiejętności i wykształcenie są kompletne?",
            "Czy tekst z bocznej kolumny nie przerywa zdania w opisie doświadczenia?"
          ]
        },
        {
          "type": "paragraph",
          "text": "Jeśli po wklejeniu dostajesz „Frontend Developer, React, 2023, wykształcenie, firma”, wróć do układu dokumentu. Prosta wersja jednokolumnowa jest dobrym punktem wyjścia do poprawki. Możesz zachować typografię i odstępy, które ułatwiają czytanie."
        },
        {
          "type": "paragraph",
          "text": "Ten test pozwala zauważyć problemy z tekstem i kolejnością. Nie odtwarza parsera każdego pracodawcy. Różne narzędzia do wydobywania tekstu mogą poradzić sobie z tym samym PDF inaczej."
        },
        {
          "type": "paragraph",
          "text": "Greenhouse wymienia kolumny, złożone tabele, obrazy oraz ważne dane w nagłówkach i stopkach jako możliwe przyczyny niepełnego odczytu. To dokumentacja konkretnego produktu, a nie dowód, że każdy ATS odrzuci każdy dokument z dwiema kolumnami. Dokumentacja Greenhouse."
        }
      ],
      "links": [
        {
          "label": "Dokumentacja Greenhouse",
          "href": "https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse"
        }
      ]
    },
    {
      "heading": "PDF czy DOCX?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Zacznij od instrukcji w ogłoszeniu lub formularzu. Jeśli pracodawca wskazuje format, użyj go. Przy braku takiej instrukcji wybierz dokument, którego treść i układ potrafisz sprawdzić przed wysłaniem."
        },
        {
          "type": "paragraph",
          "text": "PDF obejrzyj i przetestuj przez kopiowanie tekstu. DOCX otwórz ponownie po zapisaniu, żeby sprawdzić, czy nie zmieniły się podziały stron, daty i położenie danych kontaktowych. Rozszerzenie pliku samo w sobie nie rozstrzyga jakości odczytu."
        },
        {
          "type": "paragraph",
          "text": "Jeśli formularz uzupełnia pola na podstawie CV, przejrzyj je przed wysłaniem. Sprawdź zwłaszcza nazwy stanowisk, pracodawców i daty. Greenhouse zaleca kandydatom kontrolę oraz poprawianie danych rozpoznanych automatycznie. FAQ dla kandydatów."
        }
      ],
      "links": [
        {
          "label": "FAQ dla kandydatów",
          "href": "https://support.greenhouse.io/hc/en-us/articles/43418495049499-MyGreenhouse-FAQ-for-Candidates"
        }
      ]
    },
    {
      "heading": "Nazwij sekcje tak, żeby było wiadomo, co zawierają",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "„Doświadczenie zawodowe”, „Projekty”, „Umiejętności” i „Wykształcenie” jasno opisują zawartość. „Moja podróż” wymaga interpretacji jeszcze przed przeczytaniem wpisów."
        },
        {
          "type": "paragraph",
          "text": "To praktyczna zasada redakcyjna, nie lista obowiązkowych słów dla wszystkich systemów. Przy każdym stanowisku trzymaj razem rolę, firmę, okres pracy i opis. Przy projekcie podaj, czy był własny, kursowy czy komercyjny. Czytelnik powinien umieć oddzielić zatrudnienie od ćwiczenia wykonanego podczas nauki."
        }
      ]
    },
    {
      "heading": "Dopasuj CV do oferty na prawdziwych przykładach",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Wybierz najważniejsze wymagania ogłoszenia i przy każdym zapisz jeden z trzech stanów:"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Mam dowód w CV. Zadbaj o jego widoczność.",
            "Mam doświadczenie, ale opis go nie pokazuje. Doprecyzuj własne działanie.",
            "Nie mam tego doświadczenia. Nie dopisuj kompetencji do dokumentu."
          ]
        },
        {
          "type": "paragraph",
          "text": "Załóżmy, że masz dwa prawdziwe fragmenty doświadczenia. Poniższy scenariusz jest fikcyjny i służy pokazaniu sposobu redakcji:"
        },
        {
          "type": "paragraph",
          "text": "Zaimplementowałam walidację formularza zamówienia w React i TypeScript. Dodałam komunikaty błędów API oraz testy ponowienia zapisu po nieudanym żądaniu."
        },
        {
          "type": "paragraph",
          "text": "Rozbudowałam współdzielony komponent wyboru terminu. Dodałam obsługę klawiatury, przywracanie fokusu i przykłady stanów komponentu w Storybooku."
        },
        {
          "type": "paragraph",
          "text": "Przy ofercie skupionej na formularzach i integracji z API pokaż pierwszy punkt wyżej. Przy pracy nad biblioteką komponentów wyeksponuj drugi. Zachowaj oba fakty. Zmień ich kolejność i ilość miejsca, jakie dostają."
        },
        {
          "type": "paragraph",
          "text": "Nie zamieniaj „testów ponowienia zapisu” na „strategię jakości całej organizacji”, jeśli taki zakres nie należał do Ciebie. Dopasowanie działa wtedy, gdy potrafisz wyjaśnić każde zdanie na rozmowie."
        },
        {
          "type": "paragraph",
          "text": "Jeśli w ogłoszeniu jest React, a rzeczywiście go używałeś, nazwij go wprost i połącz z opisem pracy. Nie potrzebujesz szeregu „React, React.js, ReactJS”. Czytelny punkt z nazwą technologii i konkretnym działaniem daje więcej informacji niż pięć wariantów nazwy."
        }
      ]
    },
    {
      "heading": "Co oznacza wynik checkera ATS?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Najpierw sprawdź, co narzędzie mierzy. Odczyt tekstu, obecność sekcji i porównanie słów z ogłoszeniem to różne zadania. Wynik ma sens w odniesieniu do podanych kryteriów. Nie przenoś go automatycznie na inne narzędzie albo system pracodawcy."
        },
        {
          "type": "paragraph",
          "text": "Przy każdej uwadze zapytaj: jaki fragment dokumentu ją uzasadnia i co mogę poprawić? „Brakuje daty przy stanowisku” prowadzi do konkretnej zmiany. „Dopasowanie 68%” bez wyjaśnienia nie wskazuje jeszcze działania."
        },
        {
          "type": "paragraph",
          "text": "Sprawdź także zakres usługi. Test technicznej czytelności CV nie musi porównywać go z ofertą ani oceniać opisu doświadczenia. CVUnfold pokazuje bezpłatny test czytelności ATS, pierwsze wrażenie i jedną poprawkę z cytatem. Formularz analizy nie zbiera ogłoszenia do automatycznego porównania; wymagania oferty porównaj z dokumentem samodzielnie."
        }
      ]
    },
    {
      "heading": "Zanim wyślesz dokument",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Sprawdź plik po ostatnim eksporcie. Popraw ewentualne błędy w polach formularza. Potem przeczytaj początek CV i zobacz, czy najsilniejszy opis odpowiada na najważniejsze wymaganie roli."
        },
        {
          "type": "paragraph",
          "text": "Jeśli problemem jest już treść, a nie odczyt, skorzystaj z poradnika o wiarygodności technicznej w CV lub zobacz przykładowy raport. Możesz też sprawdzić swoje CV w CVUnfold, żeby zacząć od jednej uwagi powiązanej z fragmentem dokumentu."
        }
      ],
      "links": [
        {
          "label": "wiarygodności technicznej w CV",
          "href": "/artykuly/wiarygodnosc-techniczna-w-cv"
        },
        {
          "label": "przykładowy raport",
          "href": "/przykladowy-raport"
        },
        {
          "label": "sprawdzić swoje CV w CVUnfold",
          "href": "/"
        }
      ]
    }
  ],
  "checklist": [],
  "title": "CV pod ATS: jak sprawdzić PDF i dopasować treść do oferty",
  "description": "Sprawdź kolejność tekstu w PDF, popraw nazwy sekcji i pokaż doświadczenie pod wymagania ogłoszenia. Praktyczny test CV i granice wyników ATS.",
  "excerpt": "Sprawdź odczyt PDF, pola formularza i dowody pod wymagania oferty. Wynik checkera odnoś do jego kryteriów.",
  "readingTime": "5 min"
};
