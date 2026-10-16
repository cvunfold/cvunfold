import { enrichArticles } from "./article-enrichment";
import { atsGuidePl } from "./ats-guide-pl";
import { frontendCvPl } from "./frontend-cv-pl";
import type { Article } from "./article-types";
export type { Article, ArticleSection } from "./article-types";
import { firstItCvArticle } from "./first-it-cv-article";

export const articles: Article[] = enrichArticles([
  {
    slug: "jak-nie-dac-sie-zastapic-przez-ai",
    cover: {"src": "/images/articles/kariera-ai-v2.webp", "alt": "Ludzka i mechaniczna dłoń wspólnie budują rozwiązanie z elementów kodu i decyzji.", "width": 1600, "height": 800},
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
    cover: {"src": "/images/articles/ownership-v2.webp", "alt": "Dłoń trzyma ciągłą nić łączącą pomysł, budowę, wdrożenie i sprawdzenie efektu.", "width": 1600, "height": 800},
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
    cover: {"src": "/images/articles/seniority-v2.webp", "alt": "CV otoczone siedmioma symbolami dowodów seniority: progresji, trudności, decyzji, ownership, rezultatów, współpracy i wsparcia innych.", "width": 1600, "height": 800},
    category: "Seniority",
    title: "Jak pokazać seniority w CV? 7 wiarygodnych dowodów",
    description: "Jak pokazać seniority w CV bez pustych deklaracji? Sprawdź 7 dowodów: progresję, trudność problemów, decyzje, ownership, wpływ i szerszy zakres.",
    excerpt: "Sama nazwa stanowiska nie pokazuje poziomu. Zobacz siedem rodzajów dowodów, które pomagają odróżnić dojrzały profil od listy obowiązków.",
    readingTime: "5 min",
    publishedAt: "2026-08-08",
    updatedAt: "2026-08-24",
    intro: "Jak pokazać seniority w CV, skoro sama liczba lat i tytuł stanowiska niewiele wyjaśniają? Potrzebujesz śladów rosnącego zakresu: trudniejszych wyzwań, ważniejszych wyborów, odpowiedzialności za rezultat i wpływu wykraczającego poza własne zadania. Nie musisz mieć wszystkich siedmiu dowodów w każdym punkcie. Dokument powinien jednak tworzyć z nich spójny wzorzec, który da się obronić na rozmowie.",
    sections: [
      {
        heading: "1. Pokaż progresję, a nie tylko staż",
        paragraphs: [
          "Staż porządkuje historię zawodową, ale nie pokazuje, czy wraz z nim rosła odpowiedzialność. Pięć lat wykonywania podobnych, dokładnie opisanych zadań może komunikować węższy poziom niż dwa lata pracy nad coraz mniej oczywistymi problemami.",
          "Porównaj dwie lub trzy ostatnie role. Czy zmienił się zakres systemu, samodzielność, trudność wyborów albo liczba osób korzystających z Twoich rozwiązań? Wydobądź tę zmianę w treści punktów. Kolejne stanowiska nie powinny wyglądać jak ta sama lista obowiązków z inną datą.",
        ],
      },
      {
        heading: "2. Nazwij wyzwanie, zanim opiszesz rozwiązanie",
        paragraphs: [
          "Technologia mówi, czym pracujesz. Sytuacja pokazuje, dlaczego praca wymagała Twojego doświadczenia. Zamiast zaczynać od „implementacji modułu”, wskaż punkt wyjścia: niestabilny checkout, niespójne komponenty używane przez kilka zespołów, kosztowny proces wydawniczy albo migrację ograniczoną kompatybilnością.",
          "Nie nazywaj zadania „złożonym” lub „strategicznym”. Pokaż źródło trudności. Czy wymagania były niepełne? Czy rozwiązanie dotykało wielu części systemu? Czy błąd mógł zatrzymać sprzedaż albo pracę innych zespołów? Konkret pozwala odbiorcy samodzielnie ocenić poziom problemu.",
        ],
      },
      {
        heading: "3. Pokaż wybór i ograniczenie",
        paragraphs: [
          "Dojrzałość techniczna jest widoczna nie w liczbie użytych narzędzi, lecz w wyborach dokonanych pod presją ograniczeń. Dobry punkt może pokazać, co trzeba było pogodzić: tempo migracji z bezpieczeństwem, autonomię zespołów ze spójnością albo wydajność z kosztem utrzymania.",
          "Nie musisz opisywać całego RFC. Wystarczy jedna decyzja i warunek, który ją ukształtował. Taki fragment tworzy też uczciwy punkt wyjścia do rozmowy: można zapytać o odrzucone warianty, ryzyko i konsekwencje.",
        ],
        example: {
          before: "Tworzenie skalowalnej architektury aplikacji e-commerce.",
          after: "Podzieliłam frontend na moduły domenowe dla trzech zespołów, zachowując wspólne logowanie i kompatybilność istniejących ścieżek checkoutu.",
          note: "Druga wersja nie deklaruje poziomu. Pokazuje wybór, zakres i ograniczenia, które można zweryfikować w rozmowie.",
        },
      },
      {
        heading: "4. Domknij odpowiedzialność poza implementacją",
        paragraphs: [
          "Punkt kończący się na „zaimplementowałem” pozostawia pytanie, kto rozpoznał potrzebę zmiany, uzgodnił kierunek, zaplanował wdrożenie i sprawdził zachowanie rozwiązania na produkcji. Jeżeli naprawdę uczestniczyłeś w tych etapach, pokaż właściwy zakres zamiast redukować go do kodowania.",
          "Ownership nie oznacza pracy w pojedynkę ani przypisywania sobie wyniku zespołu. Możesz precyzyjnie napisać, że przygotowałeś plan, uzgodniłeś kontrakt z Backendem, prowadziłeś rollout albo monitorowałeś efekt. Każdy z tych czasowników opisuje inny, sprawdzalny zakres.",
        ],
      },
      {
        heading: "5. Połącz pracę z rezultatem",
        paragraphs: [
          "Rezultat pomaga zrozumieć, po co wykonano pracę. Może nim być zmiana metryki, lecz również usunięcie ryzyka, umożliwienie innemu zespołowi samodzielnego wdrażania, skrócenie procesu albo dostarczenie potrzebnej funkcji. Nie dodawaj procentów, których nie potrafisz wyjaśnić.",
          "Gdy nie masz pomiaru, pokaż mechanizm i odbiorcę zmiany. „Dodałem testy wizualne do procesu wydawniczego, aby regresje komponentów były wykrywane przed publikacją do czterech zespołów” jest konkretniejsze niż „poprawiłem jakość oprogramowania”, choć nie zawiera efektownego procentu.",
        ],
      },
      {
        heading: "6. Wyjaśnij współpracę przez jej przedmiot",
        paragraphs: [
          "„Współpraca z Productem i Designem” jest standardowym elementem wielu ról. Sama lista funkcji nie pokazuje seniority. Znaczenie pojawia się dopiero wtedy, gdy wiadomo, co dzięki tej współpracy zostało rozstrzygnięte: zakres pierwszego wdrożenia, kryteria dostępności, kontrakt API, priorytet ryzyka albo sposób pomiaru.",
          "Nie zawłaszczaj wspólnego rozstrzygnięcia. Nazwij własny wkład: przygotowanie wariantów, ujawnienie zależności, poprowadzenie uzgodnienia czy przetłumaczenie celu produktu na ograniczenia techniczne. Taka precyzja brzmi dojrzalej niż ogólne „prowadziłem interesariuszy”.",
        ],
      },
      {
        heading: "7. Pokaż, jak Twoja praca wzmacnia innych",
        paragraphs: [
          "Senior lub Lead nie musi zarządzać ludźmi. Szerszy wpływ może wynikać ze standardu, biblioteki, dokumentacji, mechanizmu kontroli jakości albo kierunku architektonicznego, z którego korzystają inni. Istotne jest to, co zespół mógł robić lepiej lub bardziej samodzielnie.",
          "Zamiast samego „mentoringu juniorów” pokaż mechanizm: przygotowany proces review, warsztat zakończony wspólnym standardem, uproszczony onboarding albo narzędzie usuwające powtarzalną pracę. Nie chodzi o nadanie każdej pomocy strategicznego znaczenia, tylko o uczciwe wskazanie trwałego efektu.",
        ],
      },
      {
        heading: "Jak przepisać punkt bez dopisywania doświadczenia",
        paragraphs: [
          "Weź jeden ważny punkt i rozpisz go roboczo na pięć pól: punkt wyjścia, Twój zakres, wybór, ograniczenie i rezultat. Następnie zaznacz dwa lub trzy elementy, które najlepiej pokazują poziom. CV nie potrzebuje całego studium przypadku, ale powinno zawierać więcej niż nazwę technologii i obowiązek.",
          "Jeżeli brakuje Ci informacji o rezultacie albo zakresie decyzji, nie zgaduj. Zapisz pytanie do siebie lub dawnego współpracownika. Uczciwe „nie wiem” jest lepsze niż imponujący punkt, którego nie da się obronić. Seniority ma wynikać z faktów, nie z mocniejszych przymiotników.",
        ],
        example: {
          before: "Rozwój checkoutu w React i współpraca z zespołem backendowym.",
          after: "Podzieliłem migrację checkoutu na etapy, uzgodniłem z Backendem kontrakt API i odpowiadałem za bezpieczny rollout pierwszych trzech ścieżek.",
          note: "Rozwinięta wersja nie dodaje wyniku biznesowego. Wydobywa zakres wyboru i odpowiedzialności, które muszą być prawdziwe.",
        },
      },
    ],
    checklist: [
      "Czy dwie ostatnie role pokazują progresję trudności lub odpowiedzialności?",
      "Czy przy najważniejszym projekcie wiadomo, jakie wyzwanie rozwiązywałeś?",
      "Czy przynajmniej jeden punkt zawiera ważny wybór i realne ograniczenie?",
      "Czy rozróżniasz własny wkład od pracy całego zespołu?",
      "Czy pokazujesz rezultat bez wymyślania liczb?",
      "Czy współpraca ma konkretny przedmiot, a nie tylko listę działów?",
      "Czy treść doświadczenia potwierdza poziom zapisany w tytule?",
    ],
  },
  {
    slug: "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw",
    cover: {"src": "/images/articles/obowiazki-rezultaty-v2.webp", "alt": "Lista wykonanych zadań i materiały połączone z gotowym mostem, z którego korzystają ludzie.", "width": 1600, "height": 800},
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
    cover: {"src": "/images/articles/ats-dopasowanie-v2.webp", "alt": "System odczytuje strukturę CV, a człowiek sprawdza jego treść i dopasowanie do oferty.", "width": 1600, "height": 800},
    category: "ATS i pierwsze wrażenie",
    publishedAt: "2026-08-08",
    updatedAt: "2026-09-04",
    ...atsGuidePl,
  },
  {
    slug: "wiarygodnosc-techniczna-w-cv",
    cover: {"src": "/images/articles/wiarygodnosc-techniczna-v2.webp", "alt": "Lupa odsłania kod, architekturę i testy potwierdzające deklaracje techniczne w CV.", "width": 1600, "height": 800},
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
    cover: {"src": "/images/articles/dlugosc-cv-v2.webp", "alt": "Nożyczki usuwają zbędne fragmenty CV, zachowując istotne informacje w układach jedno- i dwustronicowym.", "width": 1600, "height": 800},
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
  firstItCvArticle,
  frontendCvPl,
], "pl");

export const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
