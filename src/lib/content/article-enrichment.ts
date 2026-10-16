import type { Article, ArticleSection } from "./article-types";
import type { Locale } from "@/lib/i18n";

const practicalSections: Record<string, ArticleSection> = {
  "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw": {
    heading: "Zbierz fakty, zanim przepiszesz punkt",
    paragraphs: ["Weź jedno zadanie i odtwórz sytuację przed zmianą. Zapisz własne działanie, odbiorcę i to, co można było zrobić po wdrożeniu. Oddziel rezultat sprawdzony od oczekiwanego: „dodałem kontrolę, aby wykrywać błąd” mówi o celu; „kontrola wykryła błąd w kolejnym wydaniu” opisuje obserwację."],
    blocks: [{ type: "list", items: ["Co nie działało albo wymagało ręcznej pracy?", "Którą część rozwiązania wykonałeś osobiście?", "Kto korzystał ze zmiany i co mógł zrobić inaczej?", "Jak sprawdziliście działanie: testem, przeglądem czy pomiarem?"] }],
    example: { before: "Usprawnienie pracy zespołu i poprawa jakości danych.", after: "Dodałem walidację importu pliku z zamówieniami. Niepoprawny rekord wskazuje numer wiersza i brakujące pole, a import nie zastępuje zapisanych danych po błędzie. Sprawdziłem te przypadki w testach.", note: "Przykład ilustracyjny. Wersja po zakłada, że opisane zachowanie i testy rzeczywiście powstały." },
    paragraphsAfterExample: ["Nie znamy oszczędności czasu ani skali użycia, więc nie podajemy ich w opisie. Mimo tego wiadomo, co zmieniono i jaki problem obsługuje rozwiązanie."],
  },
  "responsibilities-are-not-outcomes": {
    heading: "Collect the facts before rewriting a bullet",
    paragraphs: ["Take one task and reconstruct the situation before the change. Identify your action, its users and what became possible afterward. Distinguish a verified result from an intended one: adding a check to catch an error describes a goal; the check catching an error in a later release describes an observation."],
    blocks: [{ type: "list", items: ["What failed or required manual work?", "Which part did you implement yourself?", "Who used the change, and what could they do differently?", "How was it checked: a test, review or measurement?"] }],
    example: { before: "Improved team efficiency and data quality.", after: "Added validation to the order-file import. Invalid records identify the row and missing field, and a failed import leaves saved data unchanged. Tested these cases.", note: "Illustrative example. Use the revised description only if the behaviour and tests really existed." },
    paragraphsAfterExample: ["The time saved and usage scale are unknown, so the bullet does not invent them. It still identifies the change and the problem it handles."],
  },
  "wiarygodnosc-techniczna-w-cv": {
    heading: "Przypisz własne działanie do ważnej technologii",
    paragraphs: ["Wybierz narzędzie, które jest ważne dla roli. Zapisz jedną sytuację jego użycia, własne działanie oraz sposób sprawdzenia. Jeśli umiesz podać tylko nazwę projektu, wróć do materiałów albo zawęź deklarowany zakres."],
    example: { before: "React, TypeScript, testy automatyczne.", after: "Zaimplementowałam formularz edycji zamówienia w React i TypeScript. Dodałam walidację, zachowanie danych po błędzie API oraz testy poprawnego zapisu i ponowienia żądania.", note: "Przykład ilustracyjny. Nie dopisuj testów ani decyzji, których nie wykonałeś." },
    paragraphsAfterExample: ["Taki punkt jest użyteczny także w projekcie edukacyjnym. Dopisz jego pochodzenie i oddziel elementy z tutoriala od własnych zmian. Technologia użyta w kursie nie musi być opisywana jako doświadczenie produkcyjne.", "Jeśli projekt był zespołowy, nazwij swój fragment. „Zbudowaliśmy aplikację” opisuje rezultat zespołu. Osobny opis walidacji i testów pokazuje, za czym możesz samodzielnie stać."],
  },
  "technical-credibility-in-a-developer-cv": {
    heading: "Connect each important tool to your own action",
    paragraphs: ["Choose a tool relevant to the role. Record a situation in which you used it, your action and how it was checked. If you can only name the project, revisit the details or narrow the scope you claim."],
    example: { before: "React, TypeScript, automated testing.", after: "Implemented an order-editing form in React and TypeScript. Added validation, preservation of input after API errors and tests for successful saves and retries.", note: "Illustrative example. Do not add tests or decisions you did not carry out." },
    paragraphsAfterExample: ["The same approach works for educational projects. State where the project came from and distinguish tutorial steps from your own extensions. Coursework does not have to be presented as production experience.", "For a team project, name your contribution. Building an application together describes the team's result. A separate account of validation and tests explains what you can discuss yourself."],
  },
};

const nextLinks: Record<string, string[]> = {
  "jak-nie-dac-sie-zastapic-przez-ai": ["dlaczego-ownership-jest-wazny-dla-pracodawcow", "jak-pokazac-seniority-w-cv"],
  "how-to-stay-relevant-in-the-age-of-ai": ["why-ownership-matters-to-employers", "how-to-show-seniority-in-a-cv"],
  "dlaczego-ownership-jest-wazny-dla-pracodawcow": ["obowiazki-to-nie-rezultaty-jak-opisywac-wplyw"],
  "why-ownership-matters-to-employers": ["responsibilities-are-not-outcomes"],
  "jak-pokazac-seniority-w-cv": ["dlaczego-ownership-jest-wazny-dla-pracodawcow"],
  "how-to-show-seniority-in-a-cv": ["why-ownership-matters-to-employers"],
  "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw": ["wiarygodnosc-techniczna-w-cv"],
  "responsibilities-are-not-outcomes": ["technical-credibility-in-a-developer-cv"],
  "wiarygodnosc-techniczna-w-cv": ["cv-bez-doswiadczenia-w-it", "pierwsze-20-sekund-cv"],
  "technical-credibility-in-a-developer-cv": ["tech-cv-with-no-experience", "the-first-20-seconds-of-a-cv"],
  "ile-stron-powinno-miec-cv-programisty": ["pierwsze-20-sekund-cv"],
  "how-many-pages-should-a-developer-cv-be": ["the-first-20-seconds-of-a-cv"],
  "cv-bez-doswiadczenia-w-it": ["wiarygodnosc-techniczna-w-cv", "pierwsze-20-sekund-cv"],
  "tech-cv-with-no-experience": ["technical-credibility-in-a-developer-cv", "the-first-20-seconds-of-a-cv"],
};

function words(article: Article) {
  return [article.title, article.intro, ...(article.openingParagraphs ?? []), ...article.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.blocks ?? []).flatMap(block => block.type === "list" ? block.items : [block.text]), ...(section.example ? [section.example.before, section.example.after, section.example.note] : []), ...(section.paragraphsAfterExample ?? [])]), ...article.checklist].join(" ").split(/\s+/u).filter(Boolean).length;
}

function calibrateAiArticle(article: Article, locale: Locale): Article {
  const aiSlug = locale === "pl" ? "jak-nie-dac-sie-zastapic-przez-ai" : "how-to-stay-relevant-in-the-age-of-ai";
  if (article.slug !== aiSlug) return article;
  const paragraphs = locale === "pl" ? [
    ["Narzędzia AI można wykorzystać do przygotowania kodu, testów i dokumentacji. Sprawdź ich wynik w swoim projekcie: czas przygotowania, koszt weryfikacji i błędy znalezione podczas przeglądu. Samo wygenerowanie rozwiązania nie potwierdza jeszcze, że pasuje do ograniczeń systemu.", "W planie rozwoju oddziel sprawne wykonanie zadania od ustalenia, co trzeba zrobić. Nazwanie problemu, uzgodnienie zakresu i sprawdzenie rezultatu to konkretne obszary odpowiedzialności, które możesz rozwijać obok pracy z narzędziami."],
    ["Do pierwszych prób wybierz powtarzalne zadanie z jasnym wejściem i sposobem weryfikacji: szkic testu, transformację danych lub roboczą dokumentację. Uznaj przyspieszenie za hipotezę i sprawdź je na własnym procesie, zamiast zakładać, że każdy rodzaj zadania stanie się szybszy.", article.sections[1].paragraphs[1]],
    ["Szybkość wykonania może być przydatna, ale opis własnej wartości oprzyj również na jakości i wyborze problemu. Pokaż, jak rozpoznajesz ograniczenia, dobierasz rozwiązanie i sprawdzasz je po wdrożeniu.", article.sections[2].paragraphs[1]],
  ] : [
    ["AI tools can be used to draft code, tests and documentation. Check the result in your project: preparation time, review effort and issues found during verification. Generating a solution does not establish that it fits the system's constraints.", "Separate executing a task from deciding what needs to be done. Defining a problem, agreeing scope and checking the outcome are concrete areas of responsibility you can develop alongside your use of tools."],
    ["For an initial trial, choose a repeatable task with a clear input and verification method, such as a draft test, data transformation or working documentation. Treat faster execution as a hypothesis to test in your own process, rather than assuming every task will become faster.", article.sections[1].paragraphs[1]],
    ["Execution speed can be useful, but describe your value through quality and problem selection as well. Show how you identify constraints, choose an approach and check it after release.", article.sections[2].paragraphs[1]],
  ];
  return { ...article,
    title: locale === "en" ? "Will AI replace software developers? Plan your next career step" : article.title,
    intro: locale === "pl" ? "Z tempa rozwoju narzędzi AI nie wynika jeden scenariusz dla wszystkich stanowisk programistycznych. Proponuję praktyczny plan: sprawdź, gdzie narzędzia pomagają w Twojej pracy, rozwijaj odpowiedzialność za problem i pokaż w CV własne decyzje oraz sposób weryfikacji rezultatu." : "The pace of AI-tool development does not establish one outcome for every software role. This guide proposes a practical plan: test where tools help your work, develop responsibility for a problem and show your decisions and verification in your CV.",
    sections: article.sections.map((section, index) => index < paragraphs.length ? { ...section, paragraphs: paragraphs[index] } : section),
  };
}

export function enrichArticles(articles: Article[], locale: Locale): Article[] {
  return articles.map(original => {
    const article = calibrateAiArticle(original, locale);
    const extra = practicalSections[article.slug];
    const sections = [...article.sections, ...(extra ? [extra] : [])];
    const last = sections.at(-1);
    if (last && nextLinks[article.slug]) {
      sections[sections.length - 1] = { ...last, links: [...(last.links ?? []), ...nextLinks[article.slug].flatMap(slug => {
        const target = articles.find(item => item.slug === slug);
        return target ? [{ label: target.title, href: `${locale === "pl" ? "/artykuly" : "/en/articles"}/${slug}` }] : [];
      })] };
    }
    const intro = article.slug === "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw" ? "Opis obowiązków mówi, czym zajmowałeś się w pracy. Opis wpływu wyjaśnia, co Twoje działanie zmieniło. Zacznij od własnego wkładu i sprawdzalnego rezultatu, również wtedy, gdy nie masz pomiaru procentowego." : article.slug === "responsibilities-are-not-outcomes" ? "Responsibilities describe what you did. Impact explains what your action changed. Start with your contribution and a result you can explain, including when no percentage measurement exists." : article.intro;
    const result = { ...article, intro, sections };
    return { ...result, readingTime: `${Math.max(1, Math.ceil(words(result) / (locale === "pl" ? 200 : 220)))} min` };
  });
}
