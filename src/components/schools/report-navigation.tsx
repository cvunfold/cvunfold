"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Measure both bars because the school header wraps on narrow screens. */
export function SchoolReportNavigation({ children }: { children: ReactNode }) {
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigation.current;
    const shell = nav?.closest<HTMLElement>(".school-workspace");
    const header = shell?.querySelector<HTMLElement>(".school-header");
    if (!nav || !shell || !header) return;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    const sections = links.flatMap(link => {
      const section = document.getElementById(link.hash.slice(1));
      return section ? [{ link, section }] : [];
    });
    let active: HTMLAnchorElement | undefined;
    let frame = 0;
    const activate = (link: HTMLAnchorElement | undefined) => {
      if (!link || link === active) return;
      active = link;
      links.forEach(item => {
        if (item === link) item.setAttribute("aria-current", "location");
        else item.removeAttribute("aria-current");
      });
      // Reveal the active pill horizontally without moving the document.
      const bar = nav.getBoundingClientRect(), pill = link.getBoundingClientRect();
      if (pill.left < bar.left || pill.right > bar.right) {
        nav.scrollTo?.({ left: nav.scrollLeft + pill.left - bar.left - 8, behavior: "instant" });
      }
    };
    const update = () => {
      const line = header.getBoundingClientRect().height + nav.getBoundingClientRect().height + 32;
      let current = sections[0]?.link;
      for (const item of sections) {
        if (item.section.getBoundingClientRect().top <= line) current = item.link;
      }
      activate(current);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a") : null;
      if (link && links.includes(link) && !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) activate(link);
    };
    const measure = () => {
      shell.style.setProperty("--school-topbar-height", `${header.getBoundingClientRect().height}px`);
      shell.style.setProperty("--school-report-nav-height", `${nav.getBoundingClientRect().height}px`);
      update();
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(header);
    observer?.observe(nav);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    nav.addEventListener("click", onClick);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      nav.removeEventListener("click", onClick);
      window.removeEventListener("resize", measure);
      shell.style.removeProperty("--school-topbar-height");
      shell.style.removeProperty("--school-report-nav-height");
    };
  }, [children]);
  return <nav ref={navigation} className="school-report-nav" aria-label="Sekcje raportu">{children}</nav>;
}
