import Link from "next/link";
import type { ArticleSection } from "@/lib/content/article-types";
import type { Locale } from "@/lib/i18n";

export function ArticleSectionContent({ section, locale }: { section: ArticleSection; locale: Locale }) {
  return <>
    {section.blocks?.map((block, index) => {
      if (block.type === "heading") return <h3 key={index}>{block.text}</h3>;
      if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
      if (block.type === "list") {
        const List = block.ordered ? "ol" : "ul";
        return <List className="article-content-list" key={index}>{block.items.map(item => <li key={item}>{item}</li>)}</List>;
      }
    })}
    {section.links?.length ? <nav className="article-context-links" aria-label={locale === "pl" ? `Dalej i źródła: ${section.heading}` : `Further reading and sources: ${section.heading}`}>
      {section.links.map(link => link.href.startsWith("/") && !link.href.startsWith("//") ? <Link key={link.href} href={link.href}>{link.label}</Link> : link.href.startsWith("https://") ? <a key={link.href} href={link.href}>{link.label}</a> : null)}
    </nav> : null}
  </>;
}
