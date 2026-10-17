"use client";

import { useEffect, useState } from "react";

export function ArticleTableOfContents({ headings }: { headings: string[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = headings.map((_, index) => document.getElementById(`section-${index + 1}`));
    let frame = 0;

    const update = () => {
      frame = 0;
      // Match the reading position just below the header and anchor offset.
      const readingLine = 120;
      const current = sections.find(section => {
        if (!section) return false;
        const { top, bottom } = section.getBoundingClientRect();
        return top <= readingLine && bottom > readingLine;
      });
      setActiveId(current?.id ?? null);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    const prose = sections[0]?.parentElement;
    if (prose) observer.observe(prose);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      observer.disconnect();
    };
  }, [headings]);

  return <ol>{headings.map((heading, index) => {
    const id = `section-${index + 1}`;
    return <li key={id}><a href={`#${id}`} aria-current={activeId === id ? "location" : undefined}>{heading}</a></li>;
  })}</ol>;
}
