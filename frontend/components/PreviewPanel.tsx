import type { ReactNode } from "react";

/**
 * A labelled, terminal-style preview surface for sample/demo content.
 * Always paired with a visible "illustrative" label by the caller.
 */
export function PreviewPanel({
  title,
  badge,
  children,
  className = "",
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card overflow-hidden rounded-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-hairline bg-white/[0.02] px-4 py-3">
        <span className="size-2 rounded-full bg-signal-bad/80" />
        <span className="size-2 rounded-full bg-signal-warn/80" />
        <span className="size-2 rounded-full bg-signal-good/80" />
        <span className="ml-2 truncate font-mono text-[10.5px] text-paper-400">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function PreviewLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-400">
      {children}
    </div>
  );
}
