import type { Article } from "./articles";

export const firstItCvArticle: Article = {
  slug: "cv-bez-doswiadczenia-w-it",
  category: "Pierwsza praca w IT",
  title: "CV bez doświadczenia w IT: jak zwiększyć swoje szanse",
  description: "CV bez doświadczenia w IT możesz wzmocnić projektami z kursu, studiów i własną aplikacją. Zobacz konkretne przykłady opisów przed i po poprawie.",
  excerpt: "Nie musisz mieć doświadczenia komercyjnego, żeby poprawić CV. Zobacz, jak opisać projekty, własny wkład i sprawdzone umiejętności.",
  readingTime: "5 min",
  publishedAt: "2026-10-12",
  intro: "Brak doświadczenia komercyjnego nie oznacza, że nie masz czego wpisać do CV. Projekt z kursu, własna aplikacja czy praca zespołowa ze studiów mogą pokazać umiejętności przydatne w pierwszej pracy. Masz więc na czym oprzeć dokument i co poprawić, zanim zdobędziesz pierwsze zatrudnienie w IT.",
  openingParagraphs: [
    "Nie musisz przedstawiać się jako doświadczony developer. Na tym etapie opisz to, co już zrobiłeś: działające funkcje, własny wkład i sposób sprawdzenia aplikacji. Taki opis może wzmocnić CV i ułatwić rozmowę o Twoich umiejętnościach. Nie daje gwarancji zatrudnienia, ale jest konkretnym krokiem, na który masz wpływ.",
    "Często potrzebne informacje już są w projekcie, tylko nie trafiły do dokumentu. „Aplikacja w React” mówi mało. Formularz, który obsługuje błędne dane, zapisuje zmiany i pokazuje błąd po nieudanym żądaniu, daje znacznie więcej do opisania. Nie potrzebujesz bardziej imponującego projektu, żeby zacząć poprawiać ten punkt w CV.",
    "Poniższe przykłady są ilustracyjne. Wersje „po” zakładają, że opisane funkcje, testy i działania naprawdę miały miejsce. Jeśli czegoś nie zrobiłeś, usuń ten fragment. Poprawianie CV nie powinno wymagać dorabiania historii projektu."
  ],
  cover: {
    src: "/images/articles/cv-bez-doswiadczenia-it.webp",
    alt: "Ilustracja laptopa z projektem, kart pracy i CV na jasnym biurku.",
    width: 1600,
    height: 800
  },
  sections: [
    {
      heading: "Zacznij od tego, co działa",
      paragraphs: [
        "Przy projekcie podaj jego nazwę, cel i technologie. Następnie wybierz kilka szczegółów, które pokazują Twoją pracę. Cała lista funkcji z README nie musi trafić do CV."
      ],
      example: {
        before: "Aplikacja do zarządzania zadaniami. React, TypeScript, REST API.",
        after: "Projekt własny: aplikacja do zarządzania zadaniami w React i TypeScript. Zaimplementowałem dodawanie i edycję zadań oraz filtrowanie po statusie. Połączyłem formularze z REST API i dodałem obsługę błędów zapisu.",
        note: "Przykład ilustracyjny. Wpisz tylko działania, które rzeczywiście wykonałeś.",
        beforeLabel: "Przed",
        afterLabel: "Po"
      },
      paragraphsAfterExample: [
        "Druga wersja pozwala zrozumieć, co kryje się za nazwą aplikacji. Jest też punktem wyjścia do rozmowy: co widzi użytkownik po błędzie, czy formularz zachowuje wpisane dane, jak odświeżasz listę po zapisie?",
        "Wybierz szczegóły związane z rolą, na którą aplikujesz. W CV na frontend rozwiń formularze, interakcje i obsługę danych. Jeśli szukasz pierwszej pracy w backendzie, więcej miejsca może dostać API, walidacja i sposób zapisu w bazie. Ten sam projekt może dostarczyć materiału do obu wersji, o ile rzeczywiście pracowałeś nad tymi częściami."
      ]
    },
    {
      heading: "Projekt z kursu też można opisać uczciwie",
      paragraphs: [
        "Podaj, że aplikacja powstała podczas kursu lub bootcampu. Jeśli rozbudowałeś ją później, wyraźnie pokaż własne zmiany."
      ],
      example: {
        before: "Samodzielne stworzenie platformy e-commerce z koszykiem i płatnościami.",
        after: "Projekt kursowy: sklep internetowy z koszykiem i testową integracją płatności. Po zakończeniu kursu samodzielnie dodałem zapisywanie koszyka między wizytami oraz testy przeliczania jego wartości.",
        note: "Przykład ilustracyjny. Wpisz tylko działania, które rzeczywiście wykonałeś.",
        beforeLabel: "Przed",
        afterLabel: "Po"
      },
      paragraphsAfterExample: [
        "Z tej wersji wiadomo, co było ćwiczeniem i co zrobiłeś później. Słowo „testowa” doprecyzowuje też zakres integracji płatności. Nie sugerujesz, że obsługiwałeś prawdziwe transakcje.",
        "Jeśli odtworzyłeś aplikację według tutoriala i nie wprowadziłeś własnych zmian, nazwij ją projektem wykonanym na podstawie tutoriala. Możesz opisać przećwiczone funkcje. Nie przypisuj sobie samodzielnego zaprojektowania całego rozwiązania.",
        "Certyfikat potwierdza ukończenie kursu. Opis projektu daje miejsce na pokazanie, co umiesz po jego zakończeniu."
      ]
    },
    {
      heading: "W projekcie grupowym nazwij swoją część",
      paragraphs: [
        "„Praca w zespole” nie wyjaśnia, czym się zajmowałeś. Podaj zakres własnej pracy i sposób połączenia jej z pracą innych osób."
      ],
      example: {
        before: "Stworzenie aplikacji do rezerwacji wizyt w czteroosobowym zespole.",
        after: "Projekt zespołowy na bootcampie: aplikacja do rezerwacji wizyt. Odpowiadałem za widok dostępnych terminów i formularz rezerwacji. Uzgodniłem z osobą tworzącą API format danych oraz komunikaty dla zajętego terminu.",
        note: "Przykład ilustracyjny. Wpisz tylko działania, które rzeczywiście wykonałeś.",
        beforeLabel: "Przed",
        afterLabel: "Po"
      },
      paragraphsAfterExample: [
        "Nie musisz wymieniać wszystkich autorów ani opisywać każdego spotkania. Zostaw informację, która pozwala oddzielić Twoją pracę od wspólnego efektu. Jeżeli pomagałeś również przy innej części, możesz to dopisać, zachowując proporcje."
      ]
    },
    {
      heading: "Brak użytkowników nie wymaga wymyślania wyników",
      paragraphs: [
        "W projekcie edukacyjnym często nie masz przychodu, konwersji ani opinii klientów. Możesz za to pokazać ukończoną funkcję i sposób jej sprawdzenia."
      ],
      example: {
        before: "Poprawa jakości i wydajności aplikacji.",
        after: "Dodałem testy walidacji formularza rejestracji: pustych pól, niepoprawnego adresu e-mail i zbyt krótkiego hasła. Poprawiłem komunikaty błędów tak, aby wskazywały pole wymagające zmiany.",
        note: "Przykład ilustracyjny. Wpisz tylko działania, które rzeczywiście wykonałeś.",
        beforeLabel: "Przed",
        afterLabel: "Po"
      },
      paragraphsAfterExample: [
        "Nie ma tu procentu. Jest konkretna praca, której zakres można wyjaśnić.",
        "Jeśli rzeczywiście coś zmierzyłeś, podaj wynik wraz z warunkami pomiaru. Test na lokalnych danych nie dowodzi zachowania aplikacji przy dużym ruchu. Gdy pomiaru nie było, zostań przy tym, co zmieniłeś i sprawdziłeś.",
        "Podobnie z publikacją projektu. Link do działającego demo daje możliwość obejrzenia aplikacji. Sam w sobie nie oznacza doświadczenia w utrzymywaniu systemu dla klientów."
      ]
    },
    {
      heading: "Tutorial i AI: przygotuj się do wyjaśnienia kodu",
      paragraphs: [
        "Korzystanie z pomocy przy nauce nie przekreśla projektu. Trzymaj jednak opis w granicach tego, co rozumiesz i potrafisz wyjaśnić.",
        "Nie polecam zamieniać każdego punktu w CV w listę użytych asystentów. Jeśli jednak cały moduł powstał z wygenerowanego kodu, nie opisuj jego architektury jako własnej decyzji, której nie umiesz uzasadnić. Zastanów się, co zrobiłeś z otrzymanym rozwiązaniem: sprawdziłeś je, znalazłeś błąd, zmieniłeś obsługę danych, dopisałeś test?",
        "Przed wpisaniem funkcji do CV przejdź przez jej działanie. Wyjaśnij, skąd biorą się dane, gdzie trafiają i co dzieje się po błędzie. Jeśli nie umiesz odpowiedzieć, wróć do kodu. To konkretna luka do uzupełnienia przed rozmową."
      ]
    },
    {
      heading: "Ułatw obejrzenie swojej pracy",
      paragraphs: [
        "Przy wybranym projekcie dodaj link do repozytorium, a jeśli masz działające demo, również do niego. Sprawdź oba w oknie bez zalogowanej sesji. Repozytorium powinno zawierać instrukcję uruchomienia i krótki opis Twojego wkładu. Demo powinno działać bez Twojej pomocy.",
        "Do CV wybierz projekty, przy których potrafisz powiedzieć najwięcej konkretnego o własnej pracy. Jeden dobrze opisany projekt może być lepszym wyborem niż kilka pozycji, które różnią się wyłącznie nazwą kursu.",
        "Weź teraz jeden opis i sprawdź: czy wiadomo, co zrobiłeś osobiście, co działa i jak to sprawdziłeś? Uzupełnij brakujące informacje. Jeśli korzystasz z analizy CVUnfold, wskaż kontekst pierwszej pracy, aby analizować dokument z uwzględnieniem tego etapu kariery."
      ]
    }
  ],
  checklist: []
};
