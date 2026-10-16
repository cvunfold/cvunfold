import type { Article } from "./article-types";
import { isArticleAvailable } from "./article-types";
import { articleAlternates } from "@/lib/article-translations";
import type { Locale } from "@/lib/i18n";

const topics = [
  { id: "prepare", pl: "Napisz i sprawdź CV", en: "Write and check your CV", slugs: ["cv-bez-doswiadczenia-w-it", "cv-frontend-developera-przyklad", "pierwsze-20-sekund-cv", "ile-stron-powinno-miec-cv-programisty"] },
  { id: "experience", pl: "Pokaż doświadczenie i własny wkład", en: "Show your experience and contribution", slugs: ["wiarygodnosc-techniczna-w-cv", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw", "dlaczego-ownership-jest-wazny-dla-pracodawcow", "jak-pokazac-seniority-w-cv"] },
  { id: "career", pl: "Rozwijaj karierę w IT", en: "Develop your career in tech", slugs: ["jak-nie-dac-sie-zastapic-przez-ai"] },
] as const;

const related: Record<string, string[]> = {
  "cv-bez-doswiadczenia-w-it": ["cv-frontend-developera-przyklad", "pierwsze-20-sekund-cv", "wiarygodnosc-techniczna-w-cv"],
  "cv-frontend-developera-przyklad": ["pierwsze-20-sekund-cv", "wiarygodnosc-techniczna-w-cv", "cv-bez-doswiadczenia-w-it"],
  "pierwsze-20-sekund-cv": ["cv-frontend-developera-przyklad", "wiarygodnosc-techniczna-w-cv", "ile-stron-powinno-miec-cv-programisty"],
  "dlaczego-ownership-jest-wazny-dla-pracodawcow": ["obowiazki-to-nie-rezultaty-jak-opisywac-wplyw", "jak-pokazac-seniority-w-cv", "cv-frontend-developera-przyklad"],
  "jak-pokazac-seniority-w-cv": ["dlaczego-ownership-jest-wazny-dla-pracodawcow", "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw", "cv-frontend-developera-przyklad"],
  "obowiazki-to-nie-rezultaty-jak-opisywac-wplyw": ["cv-frontend-developera-przyklad", "dlaczego-ownership-jest-wazny-dla-pracodawcow", "wiarygodnosc-techniczna-w-cv"],
  "wiarygodnosc-techniczna-w-cv": ["cv-frontend-developera-przyklad", "pierwsze-20-sekund-cv", "jak-pokazac-seniority-w-cv"],
  "ile-stron-powinno-miec-cv-programisty": ["pierwsze-20-sekund-cv", "cv-frontend-developera-przyklad", "cv-bez-doswiadczenia-w-it"],
  "jak-nie-dac-sie-zastapic-przez-ai": ["dlaczego-ownership-jest-wazny-dla-pracodawcow", "jak-pokazac-seniority-w-cv", "wiarygodnosc-techniczna-w-cv"],
};

function localSlug(slug: string, locale: Locale) {
  return locale === "pl" ? slug : articleAlternates(slug, "pl")?.en.split("/").at(-1);
}

export function articleGroups(articles: Article[], locale: Locale) {
  const available = new Map(articles.filter(isArticleAvailable).map(article => [article.slug, article]));
  return topics.map(topic => ({ id: topic.id, title: topic[locale], articles: topic.slugs.map(slug => available.get(localSlug(slug, locale) ?? "")).filter((article): article is Article => Boolean(article)) })).filter(group => group.articles.length);
}

export function relatedArticles(articles: Article[], article: Article, locale: Locale) {
  const plSlug = locale === "pl" ? article.slug : articleAlternates(article.slug, "en")?.["pl-PL"].split("/").at(-1);
  const candidates = (related[plSlug ?? ""] ?? []).map(slug => localSlug(slug, locale));
  const available = articles.filter(item => item.slug !== article.slug && isArticleAvailable(item));
  const selected = candidates.map(slug => available.find(item => item.slug === slug)).filter((item): item is Article => Boolean(item));
  return [...selected, ...available.filter(item => !selected.includes(item))].slice(0, 3);
}

export function featuredArticles(articles: Article[], locale: Locale) {
  const slugs = ["cv-bez-doswiadczenia-w-it", "pierwsze-20-sekund-cv", "cv-frontend-developera-przyklad", "wiarygodnosc-techniczna-w-cv"];
  return slugs.map(slug => articles.find(article => article.slug === localSlug(slug, locale) && isArticleAvailable(article))).filter((article): article is Article => Boolean(article)).slice(0, 3);
}
