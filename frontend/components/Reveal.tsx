import type { ReactNode } from "react";

/**
 * Progressive depth reveal.
 *
 * The content is fully present without JavaScript and in browsers without
 * scroll-driven animations. Where `animation-timeline: view()` is supported,
 * a short, non-blocking depth cue plays as the block enters the viewport.
 * It never reserves a blank section.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      data-reveal
      className={className}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
