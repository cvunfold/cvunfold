"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type ComponentProps, type MouseEvent, type ReactElement } from "react";
import { ChevronDown } from "lucide-react";

type Props = ComponentProps<"details">;
/** Native details semantics, with an interruptible open/close animation. */
export function AnimatedDetails({ children, className = "", open, ...props }: Props) {
  const details = useRef<HTMLDetailsElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const expanded = useRef(Boolean(open));
  useEffect(() => {
    animation.current?.cancel(); animation.current = null;
    expanded.current = Boolean(open);
    if (details.current) details.current.open = Boolean(open);
    if (content.current) { content.current.style.height = ""; content.current.style.overflow = ""; content.current.inert = !open; }
    details.current?.setAttribute("data-expanded", String(Boolean(open)));
    details.current?.querySelector("summary")?.setAttribute("aria-expanded", String(Boolean(open)));
  }, [open]);
  useEffect(() => () => animation.current?.cancel(), []);

  const nodes = Children.toArray(children);
  const summary = nodes[0];
  if (!isValidElement<ComponentProps<"summary">>(summary) || summary.type !== "summary") {
    return <details {...props} className={className} open={open}>{children}</details>;
  }
  function toggle(event: MouseEvent<HTMLElement>) {
    (summary as ReactElement<ComponentProps<"summary">>).props.onClick?.(event);
    if (event.defaultPrevented || !details.current || !content.current) return;
    event.preventDefault();
    const element = details.current, body = content.current;
    const next = !expanded.current;
    const start = body.getBoundingClientRect().height;
    animation.current?.cancel();
    expanded.current = next;
    element.setAttribute("data-expanded", String(next));
    element.querySelector("summary")?.setAttribute("aria-expanded", String(next));
    body.inert = !next;
    element.open = true;
    body.style.height = `${start}px`;
    const finish = () => { element.open = next; body.style.height = ""; body.style.overflow = ""; animation.current = null; };
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || typeof body.animate !== "function") { finish(); return; }
    const end = next ? body.scrollHeight : 0;
    body.style.overflow = "hidden";
    const active = body.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    animation.current = active;
    active.onfinish = () => { if (animation.current === active) finish(); };
  }
  return <details {...props} ref={details} open={open} data-expanded={Boolean(open)} className={`disclosure ${className}`}>
    {cloneElement(summary, { onClick: toggle, "aria-expanded": Boolean(open) }, <>{summary.props.children}<span className="disclosure-indicator" aria-hidden="true"><ChevronDown/></span></>)}
    <div ref={content} className="disclosure-content"><div className="disclosure-inner">{nodes.slice(1)}</div></div>
  </details>;
}
