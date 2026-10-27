import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui";

/**
 * Consistent page chrome: a simple page header followed by a content area.
 * The site footer is rendered globally from the root layout.
 */
export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-shell">
      <header className="page-shell-header border-b border-hairline">
        <div className="shell py-16 sm:py-20">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-3xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h1 className="heading-display mt-5 text-primary">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-5 max-w-prose text-dense-lg text-secondary">{subtitle}</p>
              )}
              {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
            {aside && <div className="lg:pb-1">{aside}</div>}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
