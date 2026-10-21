"use client";

import { useRef, type ReactNode } from "react";

/**
 * Dark terminal panel. The hover glow follows the cursor via two CSS custom
 * properties (--mx / --my) updated on mouse move; the glow itself is drawn in
 * CSS (.tool-card::after), so there is no per-frame React re-render.
 */
export function ToolCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <article ref={ref} onMouseMove={onMouseMove} className="tool-card">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
          {title}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
          {subtitle}
        </span>
      </header>

      <div className="overflow-hidden rounded-[4px] border border-hairline bg-[var(--bg-subtle)]">
        {children}
      </div>

      <footer className="font-mono text-[10.5px] leading-relaxed text-tertiary">
        {footer}
      </footer>
    </article>
  );
}
