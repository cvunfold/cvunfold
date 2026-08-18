export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  example?: {
    before: string;
    after: string;
    note: string;
  };
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string;
  updatedAt?: string;
  intro: string;
  sections: ArticleSection[];
  checklist: string[];
};

export const articles: Article[] = [
  {
    slug: "jak-nie-dac-sie-zastapic-przez-ai",
    category: "Kariera i AI",
    title: "Czy AI zastąpi programistów? Jak zabezpieczyć swoją karierę",
    description: "Czy AI zastąpi programistów? Sprawdź, które zadania są podatne na automatyzację i jak rozwijać ownership, osąd, wiedzę domenową oraz wpływ.",
    excerpt: "AI przyspiesza przewidywalne zadania. Zobacz, jak budować przewagę opartą na decyzjach, kontekście, odpowiedzialności i wpływie.",
    readingTime: "14 min",
    publishedAt: "2026-08-09",
    updatedAt: "2026-08-12",
    intro: "Czy AI zastąpi programistów? Zmieni sposób pracy i zmniejszy wartość części powtarzalnych zadań, ale nie daje to uczciwej podstawy do obietnicy, że cały zawód zniknie albo pozostanie bez zmian. Lepsze pytanie brzmi: jak nie dać się zastąpić przez AI tam, gdzie Twoja rola sprowadza się dziś głównie do przewidywalnego wykonania? Ten poradnik pomaga przesunąć wartość w stronę kontekstu, osądu, odpowiedzialności i doprowadzania ważnych problemów do rezultatu.",
    sections: [
      {
        heading: "Krótka odpowiedź: AI zmieni pracę programisty, nie całą odpowiedzialność",
        paragraphs: [
          "AI potrafi już przyspieszać pisanie kodu, testów, dokumentacji, analizę błędów i poznawanie obcego systemu. To realna zmiana. Nie wynika z niej jednak, że narzędzie samodzielnie przejmuje pełny kontekst produktu, konsekwencje decyzji, uzgodnienia między zespołami i odpowiedzialność za zachowanie systemu po wdrożeniu.",
          "Najbardziej narażona nie jest konkretna nazwa stanowiska, lecz praca opisana wyłącznie jako seria dobrze zdefiniowanych zadań. Im większa część Twojej wartości polega na rozpoznaniu właściwego problemu, ocenie ryzyka, podjęciu decyzji i sprawdzeniu efektu, tym trudniej sprowadzić ją do samego wygenerowania rozwiązania.",
        ],
      },
      {
        heading: "Które zadania są najbardziej podatne na automatyzację",
        paragraphs: [
          "Najłatwiej przyspieszyć zadania powtarzalne, dobrze opisane i łatwe do zweryfikowania: przygotowanie standardowego komponentu, szkicu testów, transformacji danych, dokumentacji albo pierwszej wersji rozwiązania w znanym wzorcu. Nie oznacza to, że te zadania przestają być potrzebne. Oznacza, że samo ich wykonywanie daje coraz słabszą przewagę.",
          "Zrób prosty przegląd tygodnia. Oznacz zadania, w których wejście i oczekiwany wynik były oczywiste, oraz te, w których trzeba było odkryć brakujące założenie, wybrać kompromis, porozumieć się z innymi albo ponieść odpowiedzialność za wynik. Pierwsza grupa pokazuje, co warto automatyzować. Druga wskazuje, gdzie rozwijać swoją specjalizację.",
        ],
      },
      {
        heading: "Nie konkuruj z AI wyłącznie szybkością wykonywania",
        paragraphs: [
          "Jeśli Twoja przewaga brzmi „piszę kod szybciej”, „tworzę więcej wariantów” albo „obsługuję więcej ticketów”, narzędzia AI będą coraz mocniej naciskały właśnie na ten obszar. Szybsze wykonanie nadal ma znaczenie, lecz staje się łatwiejsze do skopiowania i trudniejsze do obrony jako jedyna wartość specjalisty.",
          "Zmień jednostkę, w której opisujesz swoją pracę. Zamiast liczby wykonanych zadań pokaż problem, ryzyko, decyzję i zmianę, która nastąpiła. Pracodawca potrzebuje nie tylko outputu, ale osoby, która rozumie, jaki output ma sens, w jakim kontekście i za jaką cenę.",
        ],
      },
      {
        heading: "Przesuń się od wykonania do ownershipu problemu",
        paragraphs: [
          "AI potrafi pomóc przygotować implementację, przypadki testowe, dokumentację czy konfigurację infrastruktury. Samo wygenerowanie materiału nie rozstrzyga jednak, czy zespół rozwiązuje właściwy problem, czy założenia są prawdziwe i czy rezultat działa w realnym środowisku organizacji.",
          "Ownership oznacza rozpoznanie niejasności, zebranie kontekstu, zaproponowanie kierunku, uzgodnienie kompromisów i sprawdzenie efektu po wdrożeniu. To nie przywilej managera ani Leada. Frontend Developer może przejąć odpowiedzialność za wydajność krytycznej ścieżki, QA za strategię ryzyka, a Platform Engineer za doświadczenie zespołów korzystających z platformy.",
        ],
        example: {
          before: "Implementacja zadań przy użyciu AI i code review.",
          after: "Rozpoznałem najczęstsze źródło regresji w procesie wydawniczym, zaproponowałem kontrolę jakości wspieraną przez AI i odpowiadałem za pomiar jej skuteczności po wdrożeniu.",
          note: "Narzędzie pozostaje w opisie, ale głównym sygnałem stają się diagnoza, odpowiedzialność i sprawdzenie rezultatu.",
        },
      },
      {
        heading: "Buduj osąd, którego nie da się sprowadzić do promptu",
        paragraphs: [
          "Wartość doświadczonego specjalisty często ujawnia się przed rozpoczęciem implementacji: w wyborze problemu, wykryciu błędnego założenia, nazwaniu ryzyka albo odrzuceniu rozwiązania, które wygląda dobrze w demonstracji, lecz będzie zbyt kosztowne w utrzymaniu.",
          "Osąd rośnie dzięki znajomości domeny, użytkowników, architektury, danych i konsekwencji wcześniejszych decyzji. Dokumentuj trade-offy. Pytaj, co może pójść źle. Wracaj do rezultatów po wdrożeniu. AI może wygenerować listę możliwości, ale to Ty powinieneś umieć wyjaśnić, dlaczego jedna z nich pasuje do konkretnego systemu i organizacji.",
        ],
      },
      {
        heading: "Stań się osobą, która wzmacnia pracę innych",
        paragraphs: [
          "Odporność kariery nie wynika tylko z indywidualnej wiedzy. Rośnie, gdy dzięki Twojej pracy cały zespół podejmuje lepsze decyzje, szybciej wykrywa ryzyko albo może bezpieczniej korzystać z nowych narzędzi. Standard, biblioteka, proces, dobra dokumentacja czy czytelny mechanizm kontroli jakości potrafią mieć większy wpływ niż pojedyncza funkcja.",
          "Nie chodzi o obowiązkowy mentoring ani mnożenie spotkań. Szukaj punktów dźwigni: usuń powtarzalny problem, uczyń wiedzę dostępną, skróć pętlę informacji zwrotnej lub wprowadź zabezpieczenie, które pozwala innym działać samodzielnie. Taki wpływ jest trudniejszy do zastąpienia, bo opiera się na zaufaniu i rozumieniu sposobu pracy organizacji.",
        ],
      },
      {
        heading: "Używaj AI, ale zachowaj odpowiedzialność za jakość",
        paragraphs: [
          "Unikanie AI nie buduje bezpieczeństwa. Znacznie lepszą strategią jest nauczenie się, gdzie narzędzie przyspiesza pracę, gdzie wymaga weryfikacji i jak zmienia profil ryzyka. Osoba, która potrafi połączyć szybkość AI z dobrym review, testami, obserwowalnością i rozumieniem domeny, staje się bardziej wartościowa niż ktoś, kto tylko generuje więcej outputu.",
          "Zbieraj przykłady odpowiedzialnego użycia: co zostało przyspieszone, jak zweryfikowałeś wynik, jakie dane lub fragmenty systemu wyłączyłeś z użycia i jaki mechanizm chronił przed błędem. Samo „korzystam z Copilota” szybko przestanie wyróżniać. Dojrzały proces i świadome granice nadal mogą.",
        ],
      },
      {
        heading: "Autodiagnoza: czy Twoja praca wygląda jak wykonywanie ticketów?",
        paragraphs: [
          "Spójrz na ostatnie trzy miesiące i odpowiedz bez upiększania: kto definiował problem, kto wybierał podejście, kto nazywał ryzyko, kto uzgadniał zależności i kto sprawdzał efekt po wdrożeniu? Jeżeli w każdym przypadku Twoja rola zaczynała się od gotowego zadania i kończyła na pull requeście, to użyteczny sygnał rozwojowy, a nie wyrok na Twoją karierę.",
          "Wybierz jeden obszar, w którym możesz rozszerzyć odpowiedzialność bez zmiany stanowiska. Zapytaj o cel biznesowy, zaproponuj sposób pomiaru, opisz trade-off albo wróć do danych po wdrożeniu. Nawet mała inicjatywa może zmienić Twoją rolę z osoby realizującej instrukcję w osobę współodpowiedzialną za rezultat.",
        ],
      },
      {
        heading: "Pokaż w CV wartość odporną na automatyzację",
        paragraphs: [
          "CV powinno pokazywać nie tylko narzędzia, lecz również to, dlaczego powierzano Ci określone problemy. Wyeksponuj decyzje, wiedzę domenową, odpowiedzialność za rezultat, pracę z ryzykiem i wpływ wykraczający poza własną listę zadań. Nie deklaruj, że jesteś „odporny na AI”. Daj odbiorcy dowody, z których sam wyciągnie taki wniosek.",
          "Przejrzyj każde ważne doświadczenie i zadaj trzy pytania: czego nie dało się rozwiązać bez kontekstu, za jaką decyzję naprawdę odpowiadałem oraz co dzięki mojej pracy stało się lepsze dla użytkownika, produktu lub zespołu? Odpowiedzi są materiałem zarówno do CV, jak i do rozmowy rekrutacyjnej.",
        ],
        example: {
          before: "Tworzenie funkcjonalności z wykorzystaniem React, TypeScript i narzędzi AI.",
          after: "Odpowiadałam za przebudowę krytycznej ścieżki rejestracji: połączyłam analizę danych, prototypowanie wspierane przez AI i testy z użytkownikami, a po wdrożeniu monitorowałam wpływ na ukończenie procesu.",
          note: "Druga wersja nie próbuje wygrać listą narzędzi. Pokazuje kontekst, odpowiedzialność i domknięcie pętli informacji zwrotnej.",
        },
      },
      {
        heading: "Plan działania na najbliższe 30 dni",
        paragraphs: [
          "Tydzień 1: spisz zadania z ostatniego miesiąca i podziel je na przewidywalne wykonanie oraz pracę wymagającą kontekstu, decyzji lub współpracy. Wybierz jeden powtarzalny fragment, który świadomie przyspieszysz z AI, wraz ze sposobem weryfikacji jakości.",
          "Tydzień 2: przejmij jeden mały problem od diagnozy do sprawdzenia efektu. Nazwij cel, ograniczenia, ryzyko i miarę powodzenia. Nie musisz prowadzić dużego projektu — ważne, by domknąć pętlę odpowiedzialności.",
          "Tydzień 3: zapisz jedną decyzję wraz z odrzuconymi opcjami i konsekwencjami. Udostępnij wiedzę w formie krótkiego RFC, checklisty, standardu albo dokumentacji, która ułatwi pracę innym.",
          "Tydzień 4: popraw w CV dwa punkty. Usuń język obowiązków, pokaż własny zakres i rezultat, ale nie dopisuj liczb ani odpowiedzialności, których nie potrafisz obronić na rozmowie. Na koniec przygotuj jedną historię o użyciu AI: co przyspieszyło, jak zweryfikowałeś wynik i za co nadal odpowiadał człowiek.",
        ],
      },
    ],
    checklist: [
      "Czy wiesz, które elementy Twojej pracy są przewidywalne i łatwe do przyspieszenia przez AI?",
      "Czy potrafisz nazwać problemy, za które odpowiadasz, a nie tylko zadania, które wykonujesz?",
      "Czy pokazujesz decyzje wymagające wiedzy domenowej, osądu albo pracy z ryzykiem?",
      "Czy umiesz wyjaśnić, jak weryfikujesz jakość pracy wspieranej przez AI?",
      "Czy wracasz do efektu po wdrożeniu zamiast kończyć odpowiedzialność na pull requeście?",
      "Czy Twoja praca ułatwia innym podejmowanie lepszych decyzji lub bezpieczne działanie?",
      "Czy CV pokazuje rezultat i odpowiedzialność wyraźniej niż sam stack narzędzi?",
    ],
  },
  {
    slug: "dlaczego-ownership-jest-wazny-dla-pracodawcow",
    category: "Ownership",
    title: "Ownership w pracy: co oznacza i jak pokazać je w CV?",
    description: "Ownership w pracy to odpowiedzialność za problem i jego rezultat, nie praca po godzinach. Zobacz, jak pokazać swój realny zakres w CV bez wyolbrzymiania roli.",
    excerpt: "Samo „pracowałem przy projekcie” nie mówi, za co naprawdę odpowiadałeś. Pokaż problem, decyzję i zakres odpowiedzialności.",
    readingTime: "7 min",
    publishedAt: "2026-08-08",
    updatedAt: "2026-08-18",
    intro: "Ownership w pracy oznacza, że bierzesz odpowiedzialność za problem i za to, co dzieje się po Twojej decyzji. Nie jest to korporacyjne określenie pracy po godzinach ani obietnica, że zrobisz wszystko sam. Dla pracodawcy to sygnał, że umiesz rozpoznać niejasność, podjąć decyzję w swoim zakresie, zaangażować właściwe osoby i doprowadzić temat do sensownego rezultatu. W CV ten sygnał często znika, choć w codziennej pracy był bardzo mocny.",
    sections: [
      {
        heading: "Jak wygląda ownership w pracy na co dzień",
        paragraphs: [
          "Nie zaczyna się od wielkiego projektu. Może oznaczać, że zamiast tylko poprawić zgłoszony błąd, sprawdzasz jego przyczynę i proponujesz zabezpieczenie przed powtórką. Albo że przed wdrożeniem pytasz o kryterium sukcesu, zauważasz zależność z innym zespołem i wracasz do danych po rolloutcie.",
          "To wciąż może być praca zespołowa. Ownership nie odbiera innym wkładu i nie wymaga samodzielnej decyzji o wszystkim. Pokazuje natomiast, że nie kończysz odpowiedzialności w chwili odhaczenia taska.",
        ],
      },
      {
        heading: "Co pracodawca rozumie przez ownership",
        paragraphs: [
          "Rekruter lub hiring manager próbuje ustalić nie tylko, przy czym pracowałeś, lecz także gdzie zaczynała się i kończyła Twoja odpowiedzialność. Czy dostałeś gotowe zadanie do wykonania? Czy sam rozpoznałeś problem? Czy wybierałeś rozwiązanie, uzgadniałeś kompromisy i odpowiadałeś za wdrożenie?",
          "Im wyższy poziom stanowiska, tym ważniejsza staje się odpowiedź na te pytania. Senior nie musi samodzielnie robić wszystkiego. Powinien jednak umieć poruszać niejasny temat do przodu, angażować właściwe osoby i brać odpowiedzialność za rezultat, a nie wyłącznie za napisany kod.",
        ],
      },
      {
        heading: "Dlaczego lista obowiązków nie wystarcza",
        paragraphs: [
          "Zdania takie jak „rozwój aplikacji”, „współpraca z zespołem” czy „udział w code review” opisują środowisko pracy, ale nie pokazują indywidualnego wkładu. Mogą dotyczyć zarówno osoby prowadzącej inicjatywę, jak i kogoś, kto realizował mały fragment zgodnie z dokładną instrukcją.",
          "Dobre CV usuwa tę niepewność. Wskazuje, jaki problem należał do Ciebie, jakie decyzje podjąłeś i co wydarzyło się później. Nie chodzi o przypisywanie sobie pracy zespołu. Chodzi o uczciwe nazwanie własnego zakresu.",
        ],
        example: {
          before: "Praca nad migracją aplikacji do Next.js.",
          after: "Przygotowałem plan migracji checkoutu do Next.js, uzgodniłem kolejność prac z zespołami Product i Backend oraz odpowiadałem za wdrożenie pierwszych trzech ścieżek.",
          note: "Druga wersja nie twierdzi, że kandydat zrobił migrację sam. Pokazuje natomiast decyzje, koordynację i zakres odpowiedzialności.",
        },
      },
      {
        heading: "Jak pokazać ownership bez przesady",
        paragraphs: [
          "Najbezpieczniejsza konstrukcja łączy cztery elementy: problem, osobistą rolę, ważną decyzję i rezultat. Nie każdy punkt musi zawierać wszystkie cztery. W całej sekcji doświadczenia powinno jednak być jasne, co było Twoje, co należało do zespołu i gdzie miałeś wpływ na kierunek prac.",
          "Używaj czasowników odpowiadających faktom. „Zaproponowałem”, „zaprojektowałam”, „prowadziłem uzgodnienia”, „odpowiadałam za” i „wdrożyłem” oznaczają różne poziomy udziału. Precyzja buduje większą wiarygodność niż najbardziej imponujące, ale niejasne „prowadziłem projekt”.",
        ],
      },
      {
        heading: "Ownership jest widoczny także w pytaniach, które zadajesz",
        paragraphs: [
          "Nie każdy ważny rezultat da się opisać liczbą. Czasem najlepszym sygnałem ownershipu jest odkrycie ryzyka, przygotowanie RFC, doprowadzenie zespołów do decyzji albo zatrzymanie rozwiązania, które byłoby zbyt kosztowne w utrzymaniu.",
          "Jeżeli po przeczytaniu punktu odbiorca wie, za jaki problem mogłeś odpowiadać ponownie w jego organizacji, CV spełnia swoje zadanie. Jeżeli widzi tylko listę technologii i czynności, zakres Twojej samodzielności pozostaje zgadywanką.",
        ],
      },
    ],
    checklist: [
      "Czy wiadomo, za jaki problem odpowiadałeś osobiście?",
      "Czy odróżniasz swój wkład od pracy całego zespołu?",
      "Czy pokazujesz przynajmniej jedną ważną decyzję albo trade-off?",
      "Czy rezultat pojawia się obok odpowiedzialności, a nie w osobnej, niejasnej sekcji?",
    ],
  },
  {
    slug: "jak-pokazac-seniority-w-cv",
    category: "Seniority",
    title: "Jak pokazać seniority w CV bez pisania „Senior” w każdym miejscu?",
    description: "Sprawdź, jakie sygnały w CV naprawdę budują obraz seniora: skala decyzji, złożoność problemów, wpływ, współpraca i odpowiedzialność.",
    excerpt: "Liczba lat doświadczenia pomaga, ale nie wystarcza. Seniority widać przede wszystkim w rodzaju problemów, decyzji i odpowiedzialności.",
    readingTime: "8 min",
    publishedAt: "2026-08-08",
    intro: "Tytuł stanowiska jest deklaracją. Seniority, które widzi pracodawca, powstaje z dowodów rozsianych po całym CV: rodzaju problemów, skali odpowiedzialności, trudności decyzji, współpracy z innymi i wpływu na rezultat. Dlatego osoba z ośmioma latami doświadczenia może wyglądać w dokumencie na Mida, a kandydat z krótszym stażem może pokazać zaskakująco dojrzały profil.",
    sections: [
      {
        heading: "Lata doświadczenia są kontekstem, nie dowodem",
        paragraphs: [
          "Staż pomaga osadzić historię zawodową, ale sam nie wyjaśnia poziomu. Pięć lat wykonywania podobnych, dokładnie opisanych zadań nie musi oznaczać większej samodzielności niż dwa lata pracy nad coraz trudniejszymi problemami.",
          "Pracodawca szuka progresji. Czy z czasem rosła skala systemu, niejasność problemów, odpowiedzialność za decyzje albo wpływ na innych? CV powinno pokazywać tę zmianę w treści punktów, nie tylko w nazwach kolejnych stanowisk.",
        ],
      },
      {
        heading: "Cztery sygnały dojrzałego profilu",
        paragraphs: [
          "Pierwszy to złożoność: problemy wykraczające poza pojedynczy komponent lub ticket. Drugi to decyzje: wybór podejścia wraz z ograniczeniami i konsekwencjami. Trzeci to wpływ: rezultat dla użytkownika, biznesu, jakości albo sposobu pracy zespołu. Czwarty to współpraca: zdolność uzgadniania kierunku z produktem, designem, backendem i innymi zespołami.",
          "Nie musisz mieć dowodu na każdy sygnał w każdym miejscu. Jeżeli jednak całe CV pokazuje wyłącznie implementację funkcji w konkretnej technologii, odbiorca ma mało podstaw, by zobaczyć poziom Senior lub Lead.",
        ],
      },
      {
        heading: "Opisuj trudność, nie tylko wielkość projektu",
        paragraphs: [
          "„Duży projekt” jest pojęciem względnym. Znacznie bardziej wiarygodne są konkretne ograniczenia: cztery zespoły korzystające z jednego design systemu, migracja bez zatrzymania sprzedaży, wymagania dostępności, budżet wydajnościowy albo konieczność utrzymania kompatybilności.",
          "Takie szczegóły pozwalają zrozumieć, dlaczego zadanie wymagało dojrzałości. Jednocześnie chronią przed pustymi określeniami w rodzaju „zaawansowana architektura” czy „strategiczny projekt”.",
        ],
        example: {
          before: "Tworzenie skalowalnej architektury aplikacji e-commerce.",
          after: "Przygotowałam podział frontendu na moduły domenowe dla trzech zespołów, zachowując wspólne logowanie i kompatybilność istniejących ścieżek checkoutu.",
          note: "Konkretne ograniczenia pokazują poziom problemu bez nazywania go „seniorowym”.",
        },
      },
      {
        heading: "Lead nie oznacza wyłącznie zarządzania ludźmi",
        paragraphs: [
          "Profil Lead może wynikać z wpływu technicznego, prowadzenia kierunku architektury, budowania standardów albo usprawniania decyzji wielu zespołów. Mentoring jest wartościowy, ale zdanie „mentoring młodszych programistów” samo w sobie niewiele mówi.",
          "Pokaż mechanizm wpływu: jakie decyzje stały się lepsze, jaki standard został przyjęty, jak skrócił się feedback loop albo jakie ryzyko zespół zaczął wykrywać wcześniej. Seniority staje się wiarygodne wtedy, gdy odbiorca widzi zmianę wykraczającą poza Twój własny backlog.",
        ],
      },
    ],
    checklist: [
      "Czy widać progresję trudności i odpowiedzialności między rolami?",
      "Czy przynajmniej jeden punkt pokazuje decyzję wraz z ograniczeniem?",
      "Czy opisujesz wpływ wykraczający poza samo napisanie kodu?",
      "Czy tytuł stanowiska jest potwierdzony przez treść doświadczenia?",
    ],
  },
  {
    slug: "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw",
    category: "Wpływ i rezultaty",
    title: "Obowiązki to nie rezultaty. Jak opisywać wpływ w CV?",
    description: "Zamień listę codziennych obowiązków w uczciwy opis wpływu. Naucz się pokazywać rezultat także wtedy, gdy nie masz gotowych metryk biznesowych.",
    excerpt: "„Rozwój aplikacji w React” mówi, co robiłeś. Nie mówi, co dzięki temu stało się lepsze. Rezultat nie zawsze musi być procentem.",
    readingTime: "7 min",
    publishedAt: "2026-08-08",
    intro: "Większość słabych punktów w CV nie jest nieprawdziwa. Jest po prostu zbyt bliska zakresowi obowiązków z umowy lub opisu stanowiska. Kandydat mówi, czym zajmował się każdego dnia, a pracodawca próbuje ustalić, czy ta praca cokolwiek zmieniła. Dobrze opisany wpływ odpowiada na to pytanie bez wymyślania liczb.",
    sections: [
      {
        heading: "Obowiązek opisuje aktywność. Rezultat opisuje zmianę",
        paragraphs: [
          "„Implementacja nowych funkcji”, „naprawa błędów” i „code review” to działania. Mogą być wykonywane świetnie albo przeciętnie, w małym lub dużym zakresie. Bez kontekstu nie pozwalają ocenić wartości doświadczenia.",
          "Rezultatem może być poprawa metryki, ale także usunięcie ryzyka, skrócenie procesu, zmniejszenie liczby regresji, umożliwienie innemu zespołowi pracy albo dostarczenie funkcji ważnej dla określonej grupy użytkowników.",
        ],
      },
      {
        heading: "Co zrobić, jeśli nie znasz procentów",
        paragraphs: [
          "Nie dopisuj liczb, których nie możesz obronić. Poszukaj innych form konkretu: skali wdrożenia, liczby obsługiwanych rynków, zespołów korzystających z rozwiązania, ograniczenia technicznego, krytycznego procesu albo tego, co stało się możliwe po zmianie.",
          "Możesz też użyć rezultatu jakościowego, jeżeli jest precyzyjny. „Wprowadziliśmy testy wizualne dla biblioteki komponentów, dzięki czemu regresje były wykrywane przed publikacją paczki” jest lepsze niż fałszywe „zmniejszyliśmy liczbę błędów o 40%”.",
        ],
        example: {
          before: "Odpowiedzialność za testy i jakość frontendu.",
          after: "Wprowadziłem testy wizualne do procesu publikacji design systemu, aby wykrywać regresje komponentów przed udostępnieniem ich czterem zespołom produktowym.",
          note: "Nie ma procentu, ale jest mechanizm, moment wykrycia ryzyka i skala odbiorców.",
        },
      },
      {
        heading: "Najpierw dowód, później mocne słowo",
        paragraphs: [
          "Określenia „zoptymalizowałem”, „usprawniłam” i „zwiększyłem” naturalnie rodzą pytanie: o ile albo w jaki sposób? Jeżeli nie możesz podać pomiaru, wyjaśnij mechanizm zmiany. W przeciwnym razie mocny czasownik może obniżyć wiarygodność punktu.",
          "Dobry opis wpływu jest audytowalny. Podczas rozmowy potrafisz opowiedzieć, skąd wiesz, że problem istniał, co dokładnie zrobiłeś i po czym zespół poznał, że rozwiązanie działa.",
        ],
      },
      {
        heading: "Nie każdy punkt musi być osiągnięciem",
        paragraphs: [
          "CV nie powinno udawać listy spektakularnych sukcesów. Część punktów może opisywać zakres produktu, domenę lub technologie potrzebne do zrozumienia roli. Problem zaczyna się wtedy, gdy wszystkie punkty są wyłącznie obowiązkami.",
          "Dla każdej ważnej roli wybierz dwa lub trzy dowody wpływu. Pozostałe informacje skróć tak, aby nie konkurowały z najmocniejszymi sygnałami. Hierarchia jest częścią komunikacji — rezultat ukryty w ósmym punkcie często działa tak, jakby nie było go wcale.",
        ],
      },
    ],
    checklist: [
      "Czy punkt mówi, co zmieniło się dzięki Twojej pracy?",
      "Czy liczba ma źródło, które potrafisz wyjaśnić podczas rozmowy?",
      "Czy bez liczby pokazujesz mechanizm, skalę albo usunięte ryzyko?",
      "Czy najmocniejsze rezultaty są na początku opisu stanowiska?",
    ],
  },
  {
    slug: "pierwsze-20-sekund-cv",
    category: "ATS i pierwsze wrażenie",
    title: "ATS a pierwsze 20 sekund CV: co czyta system, co widzi człowiek",
    description: "Jak ATS czyta CV, a co ocenia człowiek w pierwszych 20 sekundach? Oddziel parsowanie i słowa kluczowe od seniority, ownershipu i wpływu.",
    excerpt: "ATS może wyciągnąć dane i wesprzeć wyszukiwanie. Pierwsze wrażenie człowieka odpowiada na inne pytanie: jaki profil i poziom naprawdę komunikuje dokument?",
    readingTime: "8 min",
    publishedAt: "2026-08-08",
    updatedAt: "2026-08-17",
    intro: "CV przechodzi przez dwie różne warstwy oceny. System może wyciągnąć dane, ułatwić wyszukiwanie albo wesprzeć dopasowanie. Człowiek próbuje natomiast szybko zrozumieć rolę, poziom i wiarygodność doświadczenia. Wokół ATS powstał wygodny mit o jednej maszynie, która przyznaje uniwersalny wynik. Rzeczywistość jest mniej widowiskowa i bardziej użyteczna: możesz przygotować dokument tak, aby był łatwy do odczytania przez oprogramowanie i przekonujący w pierwszych 20 sekundach, ale są to dwa osobne zadania.",
    sections: [
      {
        heading: "ATS to kategoria systemów, nie jeden egzamin",
        paragraphs: [
          "Applicant Tracking System pomaga firmie obsługiwać kandydatów i etapy procesu. Zakres funkcji zależy od produktu oraz konfiguracji pracodawcy. Sam skrót ATS nie mówi jeszcze, czy firma używa wyłącznie bazy kandydatów, wyszukiwania pełnotekstowego, filtrów, dodatkowego modułu AI czy ręcznej oceny dokumentów.",
          "Anglojęzyczne poradniki opisują zwykle systemy amerykańskie, a polski kandydat najczęściej trafia na eRecruiter, Traffit lub HRlink. Część pracodawców z międzynarodową rekrutacją korzysta z platform globalnych. Każdy z tych produktów ma inny zestaw funkcji i inną konfigurację w konkretnej firmie, więc nie istnieje jeden wynik, pod który dałoby się CV wyoptymalizować.",
          "To ważne, ponieważ poradnik obiecujący „zdanie ATS” zwykle upraszcza kilka różnych mechanizmów do jednego wyniku. Możesz sprawdzić techniczną czytelność CV i zgodność z konkretną ofertą. Nie możesz uczciwie obiecać, że jeden procent odwzoruje konfigurację wszystkich pracodawców.",
        ],
      },
      {
        heading: "Krok pierwszy: parser próbuje wydobyć dane z CV",
        paragraphs: [
          "Parser przekształca dokument w dane, które można umieścić w profilu kandydata. Może rozpoznać imię, dane kontaktowe, stanowiska, firmy, daty, edukację lub umiejętności. Gdy układ jest zbyt złożony, część informacji może trafić do niewłaściwego pola albo nie zostać rozpoznana.",
          "Najbezpieczniejszy dokument ma prawdziwy tekst, standardowe nagłówki i przewidywalną kolejność sekcji. Skan, tekst zapisany jako obraz, wielokolumnowy układ, informacje w nagłówku lub stopce oraz rozbudowane elementy graficzne zwiększają ryzyko błędnego odczytu. Nie oznacza to zakazu dobrego designu. Oznacza, że estetyka nie powinna zależeć od konstrukcji, która gubi treść po prostym zaznaczeniu lub skopiowaniu tekstu.",
        ],
      },
      {
        heading: "Czytelność dla ATS nie zastępuje przekazu dla człowieka",
        paragraphs: [
          "Tu kończy się praca, którą wykona za Ciebie format, i zaczyna ta, której nie wykona. Poprawnie sparsowane CV może nadal nie wyjaśniać poziomu kandydata. System rozpozna nazwę stanowiska, React i pięć lat doświadczenia, ale sama obecność tych pól nie pokazuje, czy podejmowałeś decyzje, odpowiadałeś za rezultat albo rozwiązywałeś problemy o rosnącej złożoności.",
          "Potrzebujesz obu warstw jednocześnie. Maszynowa ma pozwolić odczytać dokument: jasne sekcje, tekstowy plik i prawdziwe nazwy ważnych kompetencji. Ludzka ma pozwolić zrozumieć doświadczenie: konkretny zakres, decyzje, ograniczenia, wpływ i dowody wspierające docelowy poziom. Pierwszej brakuje sensu bez drugiej, a druga bez pierwszej może nigdy nie zostać przeczytana.",
        ],
        example: {
          before: "Senior Frontend Developer. React, TypeScript, Next.js. Rozwój nowych funkcji.",
          after: "Odpowiadałem za migrację checkoutu do Next.js: podzieliłem rollout na etapy, uzgodniłem kontrakt API i monitorowałem błędy po uruchomieniu.",
          note: "Obie wersje są łatwe do odczytania. Tylko druga daje człowiekowi materiał do oceny zakresu odpowiedzialności.",
        },
      },
      {
        heading: "Krok drugi: wyszukiwanie i filtry zależą od pracodawcy",
        paragraphs: [
          "Wróćmy na moment do warstwy maszynowej, bo po zapisaniu aplikacji część systemów pozwala rekruterowi szukać słów i fraz w CV. Dostępne są również filtry oraz zapytania łączące terminy, na przykład wymagające jednocześnie nazwy roli i technologii. To nie jest tajny słownik. Kryteria wynikają z konkretnego stanowiska, sposobu pracy zespołu i ustawień użytkownika systemu.",
          "Dlatego nazwa kluczowej technologii powinna pojawić się w CV, jeśli naprawdę jej używałeś i jest ważna dla oferty. Umieść ją nie tylko w sekcji umiejętności, ale także przy doświadczeniu, które pokazuje praktyczny zakres. Nie kopiuj całego ogłoszenia i nie powtarzaj jednego hasła w każdym punkcie. Dokument ma pozostać wiarygodny po otwarciu przez człowieka.",
        ],
        example: {
          before: "React, React.js, ReactJS, frontend React, biblioteka React.",
          after: "React i TypeScript — rozwój checkoutu, optymalizacja renderowania i utrzymanie współdzielonej biblioteki komponentów.",
          note: "Druga wersja zawiera rozpoznawalną technologię, ale łączy ją z zakresem pracy zamiast sztucznie zwiększać liczbę powtórzeń.",
        },
      },
      {
        heading: "Matching i AI są dodatkowymi funkcjami, nie definicją każdego ATS",
        paragraphs: [
          "Niektóre platformy oferują dopasowanie kandydata do wymagań lub asystenta wspierającego screening. Taka funkcja może analizować umiejętności, historię stanowisk i kryteria ustawione dla konkretnej roli. Nie należy z tego wnioskować, że każdy ATS automatycznie nadaje kandydatom ten sam wynik.",
          "Dobry przykład daje Greenhouse: opisuje Talent Matching jako osobną funkcję wymagającą włączenia i kalibracji, a wynik jako wsparcie dla rekrutera, nie automatyczną decyzję o przyjęciu lub odrzuceniu. Inny produkt albo inna firma mogą mieć zupełnie inny proces. Uczciwa optymalizacja zaczyna się więc od oferty i jakości dowodów, a nie od prób odgadnięcia jednego algorytmu.",
        ],
      },
      {
        heading: "Warstwa człowieka: co dzieje się po 5, 10 i 20 sekundach",
        paragraphs: [
          "Po kilku sekundach uwagę przyciągają aktualna rola, nagłówki, firmy, daty i ogólna gęstość dokumentu. Około dziesiątej sekundy odbiorca zaczyna szukać fragmentu, który potwierdza deklarowany poziom: decyzji, rezultatu, skali albo zakresu odpowiedzialności. Po dwudziestu sekundach może już istnieć robocza historia: specjalista od wydajności, produktowy frontendowiec, solidny wykonawca albo profil, którego trudno jednoznacznie opisać.",
          "To nie jest prawdziwa decyzja rekrutacyjna ani prognoza jej wyniku. Jest to model pierwszego wrażenia na podstawie samego dokumentu. Nie kontrolujesz każdej interpretacji, ale możesz sprawić, aby najmocniejsze, prawdziwe dowody były łatwiejsze do zauważenia niż ogólne obowiązki i drugorzędne technologie.",
        ],
      },
      {
        heading: "Praktyczny test CV przed wysłaniem",
        paragraphs: [
          "Najpierw sprawdź ekstrakcję. Otwórz PDF, zaznacz całą treść i wklej ją do prostego edytora tekstu. Zobacz, czy stanowiska, firmy, daty i punkty zachowują logiczną kolejność. Jeżeli aplikujesz przez formularz, sprawdź również pola uzupełnione po wgraniu pliku i popraw błędy przed wysłaniem.",
          "Następnie porównaj dokument z ofertą. Zaznacz wymagania, które faktycznie spełniasz, i upewnij się, że ich dowody są widoczne w doświadczeniu. Oddziel trzy sytuacje: kompetencja jest pokazana, kompetencja istnieje, ale jest ukryta, albo nie masz podstaw, by ją deklarować. Tylko druga sytuacja wymaga lepszej ekspozycji. Trzeciej nie naprawiaj słowem kluczowym.",
          "Na końcu przeczytaj pierwszą stronę jak człowiek, który nie zna Twojej historii. Czy w kilkanaście sekund wiadomo, jakiej roli szukasz, jaki poziom komunikuje dokument i który fragment jest najmocniejszym dowodem? Technicznie czytelny plik otwiera drzwi do oceny. Nie wykonuje tej pracy za Ciebie.",
        ],
      },
      {
        heading: "Co mierzy checker ATS, a czego nie powinien obiecywać",
        paragraphs: [
          "Checker może użytecznie sprawdzić, czy z pliku da się wydobyć tekst, czy sekcje są rozpoznawalne, czy ważne terminy z konkretnej oferty mają potwierdzenie i czy format nie tworzy oczywistych problemów. To kontrola higieny dokumentu, nie prognoza wyniku rekrutacji.",
          "Ostrożnie traktuj narzędzie, które pokazuje wysoki procent bez wyjaśnienia kryteriów, obiecuje zgodność ze wszystkimi systemami albo sugeruje, że samo dodanie słów gwarantuje rozmowę. Dobry wynik powinien prowadzić do konkretnego fragmentu CV i rozróżniać błąd odczytu, brak widocznego dowodu oraz rzeczywisty brak informacji.",
        ],
      },
    ],
    checklist: [
      "Czy po skopiowaniu tekstu z PDF zachowuje się logiczna kolejność sekcji?",
      "Czy używasz standardowych nagłówków dla doświadczenia, umiejętności i edukacji?",
      "Czy kluczowe technologie z oferty są prawdziwe i potwierdzone przy konkretnym doświadczeniu?",
      "Czy dokument nie polega na skanie, ozdobnych tabelach, nagłówkach lub stopkach zawierających ważną treść?",
      "Czy odróżniasz techniczną czytelność od oceny seniority, ownershipu i wpływu?",
      "Czy na pierwszym ekranie wiadomo, jakiej roli szukasz i który dowód najlepiej pokazuje Twój poziom?",
      "Czy potrafisz obronić każde dopasowanie podczas rozmowy bez dopisywania faktów?",
      "Czy checker wyjaśnia kryteria zamiast obiecywać uniwersalny wynik ATS?",
    ],
  },
  {
    slug: "wiarygodnosc-techniczna-w-cv",
    category: "Wiarygodność techniczna",
    title: "Jak budować wiarygodność techniczną w CV developera?",
    description: "Technologie bez kontekstu są tylko listą słów. Zobacz, jak pokazać decyzje, ograniczenia i praktyczne użycie narzędzi, aby CV brzmiało wiarygodnie.",
    excerpt: "Długa lista technologii nie dowodzi biegłości. Wiarygodność pojawia się wtedy, gdy narzędzie ma kontekst, cel i konsekwencje.",
    readingTime: "7 min",
    publishedAt: "2026-08-08",
    intro: "Wiarygodność techniczna nie polega na umieszczeniu w CV wszystkich narzędzi, z którymi miałeś kontakt. Powstaje wtedy, gdy odbiorca widzi, do czego technologia została użyta, jaki problem rozwiązywała, jakie miała ograniczenia i jaką decyzję podjąłeś.",
    sections: [
      {
        heading: "Technologia potrzebuje kontekstu",
        paragraphs: [
          "Lista „React, Next.js, TypeScript, GraphQL, AWS” nie mówi, czy kandydat projektował rozwiązanie, utrzymywał istniejący kod, wykonał pojedynczy ticket czy tylko uczestniczył w projekcie używającym danego narzędzia.",
          "Najważniejsze technologie powinny pojawiać się przy doświadczeniu, w którym można zobaczyć ich praktyczne znaczenie. Osobna sekcja umiejętności pomaga w szybkim skanowaniu, ale nie powinna być jedynym dowodem.",
        ],
      },
      {
        heading: "Trade-off jest mocniejszy niż przymiotnik",
        paragraphs: [
          "Zdanie „zaprojektowałem nowoczesną i skalowalną architekturę” brzmi efektownie, lecz nie pozwala ocenić decyzji. Znacznie ciekawsze jest wyjaśnienie, co trzeba było pogodzić: szybkość migracji z kompatybilnością, autonomię zespołów ze spójnością, wydajność z kosztem utrzymania.",
          "Nie musisz opisywać całej decyzji architektonicznej. Jeden dobrze dobrany szczegół pokazuje sposób myślenia i daje rozmówcy punkt zaczepienia do technicznej rozmowy.",
        ],
        example: {
          before: "Stworzyłem skalowalny design system w React.",
          after: "Zaprojektowałem wersjonowanie i kontrakty API design systemu używanego przez cztery zespoły, tak aby umożliwić niezależne migracje bez łamania istniejących ekranów.",
          note: "Technologia pozostaje ważna, ale to ograniczenie i decyzja budują wiarygodność.",
        },
      },
      {
        heading: "Oddziel znajomość od ekspozycji",
        paragraphs: [
          "Jeżeli użyłeś narzędzia w jednym krótkim zadaniu, nie przedstawiaj go na równi z technologią, w której projektowałeś i utrzymywałeś produkcyjny system. CV nie wymaga procentowych pasków biegłości, ale powinno dawać uczciwe wskazówki dotyczące głębokości doświadczenia.",
          "Możesz pogrupować umiejętności według roli w praktyce: kluczowy stack, narzędzia używane produkcyjnie i dodatkowa ekspozycja. Jeszcze lepiej, gdy najważniejsze z nich są potwierdzone konkretnymi punktami w doświadczeniu.",
        ],
      },
      {
        heading: "Wiarygodność rośnie, gdy pokazujesz granice",
        paragraphs: [
          "Dojrzały profil nie musi przedstawiać każdej decyzji jako sukcesu. Migracja mogła zostać zatrzymana, eksperyment nie przynieść wyniku, a rozwiązanie zostać uproszczone po zebraniu danych. Takie doświadczenia mogą być bardzo wartościowe, jeśli pokazują jakość rozumowania.",
          "Nie zamieniaj CV w retrospektywę projektu. Wybierz jednak punkty, w których widać, że rozumiesz nie tylko implementację, ale również koszt, ryzyko i utrzymanie rozwiązania. To właśnie odróżnia listę słów kluczowych od wiarygodnego profilu technicznego.",
        ],
      },
    ],
    checklist: [
      "Czy kluczowe technologie występują w kontekście konkretnego problemu?",
      "Czy pokazujesz choć jeden trade-off albo ograniczenie?",
      "Czy poziom ekspozycji na narzędzie nie jest wyolbrzymiony?",
      "Czy potrafisz rozwinąć każdy techniczny punkt podczas rozmowy?",
    ],
  },
  {
    slug: "ile-stron-powinno-miec-cv-programisty",
    category: "Długość CV",
    title: "Ile stron powinno mieć CV programisty? Co skrócić, a co warto rozwinąć",
    description: "Jedna czy dwie strony CV programisty? Sprawdź, kiedy wystarczy krótki konkret, a kiedy warto pokazać decyzję, ryzyko i efekt swojej pracy.",
    excerpt: "Dwie strony nie są błędem, a jedno zdanie nie zawsze jest zbyt krótkie. Liczy się to, czy każdy dodatkowy fragment wnosi nowy dowód.",
    readingTime: "7 min",
    publishedAt: "2026-08-11",
    intro: "Pytanie „jedna czy dwie strony?” brzmi jak wybór formatu, ale w praktyce dotyczy hierarchii informacji. CV ma być wystarczająco krótkie, żeby dało się je szybko zrozumieć, i wystarczająco konkretne, żeby doświadczenie nie zamieniło się w listę deklaracji. Dla programisty z dłuższym stażem dwie strony mogą być całkowicie uzasadnione. Problem zaczyna się dopiero wtedy, gdy druga strona powstaje przez rozwijanie punktów, które nie dodają żadnego nowego sygnału.",
    sections: [
      {
        heading: "Jedna czy dwie strony? Liczy się gęstość informacji",
        paragraphs: [
          "Jedna strona jest użytecznym ograniczeniem dla osoby z krótką historią zawodową albo wtedy, gdy tylko część doświadczenia pasuje do wybranej roli. Nie jest jednak uniwersalną normą, do której trzeba dopasować każde CV kosztem czytelności, małej czcionki lub usuwania ważnych projektów.",
          "Dwie strony są rozsądne, gdy druga nadal zawiera istotne i różne dowody: kolejne etapy rozwoju, trudniejsze problemy, zmianę zakresu odpowiedzialności lub doświadczenie ważne dla oferty. Jeżeli na drugą stronę przechodzą dwa rozwlekłe punkty o typowych obowiązkach, lepiej najpierw poprawić ich gęstość niż walczyć z samym podziałem strony.",
        ],
      },
      {
        heading: "Krótki konkret może być wystarczający",
        paragraphs: [
          "CV nie musi zawierać pełnego studium przypadku dla każdego projektu. Zdanie „Wydzieliłem moduł płatności z monolitu do osobnego serwisu” jest krótkie, ale przekazuje konkretną zmianę i daje dobry punkt wyjścia do rozmowy. Nie wiadomo jeszcze, dlaczego podjęto tę decyzję, lecz wiadomo przynajmniej, co kandydat faktycznie zrobił.",
          "To ważna różnica. „Projektowanie architektury mikroserwisowej” może napisać niemal każdy, bo nie wskazuje żadnego rozpoznawalnego wkładu. Krótki opis nie jest słaby tylko dlatego, że nie zawiera całej historii. Powinien jednak nazywać działanie i jego przedmiot na tyle precyzyjnie, aby rozmówca mógł zadać sensowne pytanie.",
        ],
        example: {
          before: "Projektowanie architektury mikroserwisowej.",
          after: "Wydzieliłem moduł płatności z monolitu do osobnego serwisu.",
          note: "Druga wersja nadal jest krótka. Jej przewagą nie jest długość, lecz konkretny zakres zmiany.",
        },
      },
      {
        heading: "Rozwijaj punkty, które mają udowodnić seniority",
        paragraphs: [
          "Nie każdy punkt musi pokazywać pełny tok rozumowania. W każdej ważnej roli warto jednak wybrać dwa lub trzy fragmenty, które mają najmocniej potwierdzić poziom kandydata. To właśnie przy nich dodatkowe miejsce może przynieść realną wartość.",
          "Wersja kompaktowa może brzmieć: „Wydzieliłem moduł płatności z monolitu do osobnego serwisu”. Wersja dowodowa może dodać, że decyzja wynikała z analizy zależności, ryzyka wdrożeń lub potrzeby niezależnego skalowania. Drugi wariant mocniej pokazuje seniority, ale pierwszy nadal może być dobrym wyborem, gdy dokument jest już gęsty albo szczegóły łatwiej rozwinąć podczas rozmowy.",
          "Rozszerzenie ma sens wtedy, gdy ujawnia indywidualny wkład: decyzję, ograniczenie, ryzyko, kompromis albo odpowiedzialność za wdrożenie. Samo dopisanie „we współpracy z zespołem backendowym” zwykle niewiele zmienia, ponieważ taka współpraca jest normalną częścią pracy frontendowej i bez dodatkowego kontekstu nie wiadomo, co oznaczała.",
        ],
        example: {
          before: "Współpraca z zespołem backendowym przy migracji checkoutu do Next.js.",
          after: "Podzieliłem migrację checkoutu na etapy, uzgodniłem kontrakt API z backendem i odpowiadałem za bezpieczny rollout.",
          note: "Dłuższa wersja zasługuje na miejsce, bo pokazuje decyzję, realny punkt współpracy i zakres odpowiedzialności.",
        },
      },
      {
        heading: "Liczba nie zastępuje opisu trudności",
        paragraphs: [
          "Metryka pomaga potwierdzić rezultat, ale sama nie mówi jeszcze, jak trudna była praca. Poprawa LCP z 4,2 do 2,1 sekundy wygląda atrakcyjnie, lecz punktem wyjścia mogła być fatalna konfiguracja, którą wystarczyło poprawić jednym oczywistym ruchem. Bez mechanizmu zmiany trudno ocenić, czego wynik dowodzi o kandydacie.",
          "Opis diagnozy potrafi powiedzieć więcej: kandydat rozpoznał, że główny bundle blokował renderowanie, wydzielił krytyczną ścieżkę i przeniósł pozostały kod do ładowania asynchronicznego. Jeżeli miejsce pozwala, najlepiej połączyć sposób działania z wynikiem. Gdy trzeba wybierać, zachowaj fragment, który najlepiej pokazuje kompetencję istotną dla docelowej roli.",
        ],
        example: {
          before: "Poprawiłem wynik LCP z 4,2 do 2,1 sekundy.",
          after: "Zidentyfikowałem, że główny bundle blokuje renderowanie, wydzieliłem krytyczną ścieżkę i przeniosłem pozostały kod do ładowania asynchronicznego.",
          note: "Liczba pokazuje efekt. Druga wersja pokazuje diagnozę i sposób myślenia. Najmocniejszy opis łączy oba elementy, jeśli są prawdziwe i mieszczą się w hierarchii CV.",
        },
      },
      {
        heading: "Jak skracać bez utraty najważniejszych dowodów",
        paragraphs: [
          "Najpierw usuń informacje, które wynikają z samej roli lub powtarzają się w każdym stanowisku: ogólne deklaracje współpracy, listy typowych obowiązków i technologie już widoczne w sekcji umiejętności. Następnie połącz punkty opisujące ten sam problem i przenieś najmocniejsze dowody na początek każdej roli.",
          "Skracanie nie powinno polegać na usuwaniu decyzji, rezultatów i ograniczeń, a pozostawianiu samych nazw technologii. To właśnie te pierwsze informacje odróżniają Twoje doświadczenie od setek podobnych profili. Jeżeli musisz wybierać, zachowaj opis, którego nie mógłby bez zmiany podpisać prawie każdy programista pracujący w podobnym stacku.",
        ],
      },
      {
        heading: "Dobra długość wynika z priorytetów, nie z reguły",
        paragraphs: [
          "Nie istnieje jedna poprawna liczba stron dla juniora, seniora i osoby zmieniającej specjalizację. Istnieje natomiast prosta kontrola jakości: każdy dodatkowy punkt powinien wnosić nowy kontekst, dowód albo ważny warunek dopasowania do oferty.",
          "Zostaw krótkie konkrety tam, gdzie wystarczy fakt i dobry punkt zaczepienia do rozmowy. Rozwijaj kilka fragmentów, które naprawdę mają udowodnić poziom, sposób podejmowania decyzji lub wpływ. Wtedy druga strona nie jest oznaką rozwlekłości — jest konsekwencją doświadczenia, które nadal ma znaczenie dla odbiorcy.",
        ],
      },
    ],
    checklist: [
      "Czy druga strona zawiera nowe dowody, zamiast powtarzać typowe obowiązki?",
      "Czy każdy krótki punkt nazywa konkretne działanie i jego przedmiot?",
      "Czy dwa lub trzy najmocniejsze punkty pokazują decyzję, ograniczenie albo odpowiedzialność?",
      "Czy liczby mają kontekst, który wyjaśnia trudność i Twój wkład?",
      "Czy możesz skrócić informacje drugorzędne bez usuwania najmocniejszych dowodów?",
    ],
  },
];

export const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
