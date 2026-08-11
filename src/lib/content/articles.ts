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
  intro: string;
  sections: ArticleSection[];
  checklist: string[];
};

export const articles: Article[] = [
  {
    slug: "jak-nie-dac-sie-zastapic-przez-ai",
    category: "Kariera i AI",
    title: "Jak nie dać się zastąpić przez AI?",
    description: "Jak budować bezpieczniejszą karierę w świecie AI: rozwijać ownership, osąd, wiedzę domenową i wpływ zamiast konkurować wyłącznie szybkością wykonywania zadań.",
    excerpt: "Nie wygrasz z AI liczbą wygenerowanych zadań. Możesz za to budować wartość opartą na rozumieniu problemu, decyzjach, odpowiedzialności i wpływie.",
    readingTime: "10 min",
    publishedAt: "2026-08-09",
    intro: "Żaden zawód nie daje pełnej gwarancji bezpieczeństwa, a straszenie prostym hasłem „AI zabierze pracę” niewiele pomaga. Rozsądniejsze pytanie brzmi: jak budować profil, którego wartość nie zależy wyłącznie od szybkiego wykonywania zadań? Najbardziej odporna kariera powstaje tam, gdzie łączysz narzędzia AI z kontekstem, osądem, odpowiedzialnością i zdolnością doprowadzania ważnych problemów do rezultatu.",
    sections: [
      {
        heading: "Nie konkuruj z AI szybkością wykonywania",
        paragraphs: [
          "Jeśli Twoja przewaga brzmi „piszę kod szybciej”, „tworzę więcej wariantów” albo „obsługuję więcej ticketów”, narzędzia AI będą coraz mocniej naciskały właśnie na ten obszar. Szybsze wykonanie nadal ma znaczenie, lecz staje się łatwiejsze do skopiowania i trudniejsze do obrony jako jedyna wartość specjalisty.",
          "Zmień jednostkę, w której opisujesz swoją pracę. Zamiast liczby wykonanych zadań pokaż problem, ryzyko, decyzję i zmianę, która nastąpiła. Pracodawca potrzebuje nie tylko outputu, ale osoby, która rozumie, jaki output ma sens, w jakim kontekście i za jaką cenę.",
        ],
      },
      {
        heading: "Przesuń się od wykonania do ownershipu problemu",
        paragraphs: [
          "AI potrafi pomóc przygotować implementację, przypadki testowe, dokumentację czy konfigurację infrastruktury. Nie przejmuje jednak automatycznie odpowiedzialności za to, czy zespół rozwiązuje właściwy problem, czy założenia są prawdziwe i czy rezultat działa w realnym środowisku organizacji.",
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
    ],
    checklist: [
      "Czy potrafisz nazwać problemy, za które odpowiadasz, a nie tylko zadania, które wykonujesz?",
      "Czy pokazujesz decyzje wymagające kontekstu, osądu albo pracy z ryzykiem?",
      "Czy umiesz wyjaśnić, jak weryfikujesz jakość pracy wspieranej przez AI?",
      "Czy Twoja praca ułatwia innym podejmowanie lepszych decyzji lub bezpieczne działanie?",
      "Czy CV pokazuje rezultat i odpowiedzialność wyraźniej niż sam stack narzędzi?",
    ],
  },
  {
    slug: "dlaczego-ownership-jest-wazny-dla-pracodawcow",
    category: "Ownership",
    title: "Dlaczego ownership jest ważny dla pracodawców?",
    description: "Dowiedz się, czym jest ownership w CV, dlaczego odróżnia samodzielnego specjalistę od wykonawcy zadań i jak pokazać go bez wyolbrzymiania swojej roli.",
    excerpt: "Samo „pracowałem przy projekcie” nie mówi, za co naprawdę odpowiadałeś. Sprawdź, jak pokazać decyzje, odpowiedzialność i samodzielność.",
    readingTime: "7 min",
    publishedAt: "2026-08-08",
    intro: "Ownership to nie korporacyjne słowo oznaczające, że ktoś pracował po godzinach. Dla pracodawcy jest sygnałem, że kandydat potrafi przejąć odpowiedzialność za problem, podjąć decyzję, doprowadzić pracę do końca i rozumieć konsekwencje swojego rozwiązania. W CV ten sygnał często znika, nawet gdy w codziennej pracy był bardzo mocny.",
    sections: [
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
    category: "Pierwsze wrażenie",
    title: "Pierwsze 20 sekund CV: co naprawdę widzi rekruter?",
    description: "Zobacz, jak w pierwszych sekundach powstaje obraz Twojego profilu i jak uporządkować CV, aby najmocniejsze dowody nie zginęły w szczegółach.",
    excerpt: "CV nie jest czytane od początku do końca jak książka. Najpierw powstaje szybka hipoteza o Twoim profilu — dopiero później odbiorca szuka potwierdzenia.",
    readingTime: "6 min",
    publishedAt: "2026-08-08",
    intro: "Pierwsze wrażenie nie jest pełną oceną kandydata ani prawdziwą decyzją rekrutacyjną. Jest roboczą hipotezą: jaka to osoba, na jakim jest poziomie i czy warto poświęcić dokumentowi więcej uwagi. Układ CV decyduje, z jakich sygnałów ta hipoteza powstanie.",
    sections: [
      {
        heading: "Po 5 sekundach: rola, poziom i czytelność",
        paragraphs: [
          "Najpierw odbiorca zauważa nagłówki, aktualną rolę, firmy, daty i ogólną gęstość dokumentu. Próbuje odpowiedzieć na proste pytania: czym zajmuje się ta osoba, jak długa jest jej historia i gdzie powinienem szukać najważniejszego doświadczenia?",
          "Jeżeli podsumowanie jest ogólne, stanowiska mają niejasne nazwy, a najnowsza rola zaczyna się od długiej listy obowiązków, pierwsza hipoteza będzie słabsza niż rzeczywiste doświadczenie.",
        ],
      },
      {
        heading: "Po 10 sekundach: czy są konkretne dowody",
        paragraphs: [
          "Wzrok szuka liczb, nazw produktów, skali, rezultatów i słów wskazujących odpowiedzialność. To nie oznacza mechanicznego skanowania słów kluczowych. Chodzi o szybkie znalezienie fragmentu, który potwierdza deklarowany poziom.",
          "Jeden konkretny punkt o decyzji i rezultacie potrafi zrobić więcej niż całe podsumowanie pełne określeń „doświadczony”, „proaktywny” i „nastawiony na jakość”.",
        ],
      },
      {
        heading: "Po 20 sekundach: powstaje historia kandydata",
        paragraphs: [
          "Odbiorca łączy sygnały w prostą narrację: specjalista od performance, frontendowiec produktowy, osoba mocna w design systemach, solidny wykonawca albo kandydat o niejasnym profilu. Ta narracja może być trafna lub przypadkowa — zależnie od hierarchii informacji.",
          "Twoim celem nie jest kontrolowanie każdej interpretacji. Celem jest sprawienie, aby najmocniejsze, prawdziwe dowody były łatwiejsze do zauważenia niż informacje drugorzędne.",
        ],
        example: {
          before: "React, TypeScript, JavaScript, HTML, CSS, Git, Jira, REST, Agile.",
          after: "Frontend Developer specjalizujący się w wydajności checkoutu i systemach komponentów używanych przez wiele zespołów.",
          note: "Lista technologii nadal może znaleźć się niżej. Pierwszy ekran powinien najpierw wyjaśnić profil i wartość.",
        },
      },
      {
        heading: "Czytelność nie oznacza pustego dokumentu",
        paragraphs: [
          "Doświadczona osoba może potrzebować dwóch stron. Problemem nie jest sama długość, lecz brak priorytetów. Każda sekcja i każdy punkt powinny pomagać podjąć decyzję, co przeczytać dalej.",
          "Używaj standardowych nagłówków, przewidywalnej chronologii, krótkich akapitów i widocznych rezultatów. Ozdobny układ nie uratuje słabej treści, a skomplikowane kolumny mogą utrudnić zarówno szybkie czytanie, jak i parsowanie dokumentu.",
        ],
      },
    ],
    checklist: [
      "Czy w pierwszym ekranie wiadomo, jakiej roli szukasz?",
      "Czy najnowsze doświadczenie zaczyna się od najmocniejszego dowodu?",
      "Czy profil można opisać jednym konkretnym zdaniem?",
      "Czy szczegóły wspierają hierarchię, zamiast z nią konkurować?",
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
