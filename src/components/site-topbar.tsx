import type { ComponentProps } from "react";

export function SiteTopbar({ children, className, ...props }: ComponentProps<"header">) {
  return <header {...props} className={["site-topbar", className].filter(Boolean).join(" ")}>
    <div className="site-topbar-inner">{children}</div>
  </header>;
}
