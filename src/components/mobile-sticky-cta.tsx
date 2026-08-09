"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileStickyCta({ href, label, price }: { href: string; label: string; price: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroAction = document.querySelector(".hero-actions");
    if (!heroAction || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.05 });
    observer.observe(heroAction);
    return () => observer.disconnect();
  }, []);

  return <Link
    className="mobile-sticky-cta"
    href={href}
    data-visible={visible ? "true" : "false"}
    data-analytics-event="hero_cta_clicked"
    data-analytics-placement="mobile_sticky"
    aria-hidden={!visible}
    tabIndex={visible ? 0 : -1}
  >{label}<span>{price}</span></Link>;
}
