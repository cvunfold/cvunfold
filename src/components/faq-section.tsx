import Image from "next/image";
import { AnimatedDetails } from "@/components/animated-details";
type Props = {
  id: string;
  title: string;
  items: ReadonlyArray<readonly [string, string]>;
};

export function FaqSection({ id, title, items }: Props) {
  return <section id={id} className="launch-faq faq-v2 container" aria-labelledby={`${id}-title`}>
    <div className="launch-section-head faq-heading"><span>FAQ</span><h2 id={`${id}-title`}>{title}</h2><Image className="faq-illustration" src="/images/faq/cv-conversation-v1.webp" alt="" width={960} height={640} sizes="(max-width: 640px) 260px, (max-width: 900px) 320px, 420px"/></div>
    <div className="faq-list">
      {items.map(([question, answer], index) => <AnimatedDetails key={question} open={index === 0}>
        <summary role="button">
          <span className="faq-trigger">
          <span className="faq-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="faq-question">{question}</span>

          </span>
        </summary>
        <div className="faq-answer"><p>{answer}</p></div>
      </AnimatedDetails>)}
    </div>
  </section>;
}
