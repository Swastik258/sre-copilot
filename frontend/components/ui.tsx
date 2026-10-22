import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Icons — a small, consistent stroke set (no external dependency).
 * ------------------------------------------------------------------ */

export type IconName =
  | "k8s" | "logs" | "cicd" | "terraform" | "code" | "assistant"
  | "audit" | "shield" | "book" | "chat" | "life" | "settings"
  | "layers" | "bolt" | "check" | "arrow" | "compass" | "users"
  | "flag" | "lock" | "eye" | "route" | "dot" | "graph";

const PATHS: Record<IconName, ReactNode> = {
  k8s: <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Zm0 4v6m0 0 5 3m-5-3-5 3" />,
  logs: <path d="M4 6h16M4 10h10M4 14h13M4 18h7" />,
  cicd: <path d="M6 3v12m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0v6a6 6 0 0 1-6 6H9" />,
  terraform: <path d="M12 3 4 7l8 4 8-4-8-4Zm-8 8 8 4 8-4M4 15l8 4 8-4" />,
  code: <path d="m8 8-4 4 4 4m8-8 4 4-4 4M14 4l-4 16" />,
  assistant: <path d="M12 3v3m0 12v3M4.5 12h-1.5m17 0h-1.5M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />,
  audit: <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Zm-2 8 1.8 2L14 9" />,
  shield: <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" />,
  book: <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm12 0v16" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  life: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5 .5 2-2m-14 14 2-2m0-10-2-2m14 14-2-2" />,
  settings: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3-1.8-.6.4-1.9-1.6-1.6-1.9.4L14 6l-1.8.6L10.3 4.7 8.7 6.3 6.8 5.9 5.2 7.5l.4 1.9L4 12l1.6 2.6-.4 1.9 1.6 1.6 1.9-.4 1.8.6 1.7 1.6 1.6-1.6 1.9.4 1.6-1.6-.4-1.9L20 12Z" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  compass: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3 6-2 5-5 2 2-5 5-2Z" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3 3 0 1 0 0-6m-7 6c-3 0-5 1.7-5 4.5V20h10v-4.5C14 12.7 12 11 9 11Zm7-1c2.5 0 4 1.5 4 3.7V19h-4" />,
  flag: <path d="M5 21V4m0 0 7 2 7-2v9l-7 2-7-2" />,
  lock: <path d="M6 11V8a6 6 0 1 1 12 0v3m-13 0h14v9H5v-9Zm7 3v3" />,
  eye: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />,
  route: <path d="M6 19a3 3 0 1 0 0-6h6a3 3 0 0 0 0-6H8m-2 12h0" />,
  dot: <circle cx="12" cy="12" r="4" />,
  graph: <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" />,
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Small building blocks
 * ------------------------------------------------------------------ */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusTag({
  status,
  milestone,
}: {
  status: "live" | "planned" | "partial";
  milestone?: string;
}) {
  const tone = status === "live" ? "good" : status === "partial" ? "warn" : "neutral";
  const label = status === "live" ? "Live" : status === "partial" ? "Partial" : "Planned";
  return (
    <Badge tone={tone}>
      <span className={`dot ${status === "live" ? "dot-good" : status === "partial" ? "dot-warn" : "dot-idle"}`} />
      {label}
      {milestone ? ` · ${milestone}` : ""}
    </Badge>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>
  );
}

/** Standard content section with an editorial two-column header. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-b border-hairline ${className}`}>
      <div className="shell py-20">
        {(eyebrow || title || lead) && (
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && (
                <h2 className="mt-5 font-serif text-display tracking-tight text-primary">
                  {title}
                </h2>
              )}
            </div>
            {lead && (
              <p className="max-w-prose self-end text-dense-lg text-secondary">{lead}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Feature grid
 * ------------------------------------------------------------------ */

export type Feature = {
  icon: IconName;
  title: string;
  body: string;
  meta?: string;
  status?: "live" | "planned" | "partial";
  milestone?: string;
  href?: string;
};

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: Feature[];
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {items.map((f) => {
        const inner = (
          <Card hover className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-accent">
                <Icon name={f.icon} />
              </span>
              {f.status && <StatusTag status={f.status} milestone={f.milestone} />}
            </div>
            <div>
              <h3 className="font-serif text-xl text-primary">{f.title}</h3>
              <p className="mt-2 text-dense text-secondary">{f.body}</p>
            </div>
            {f.meta && (
              <div className="mt-auto border-t border-hairline pt-4 font-mono text-[10.5px] leading-relaxed text-tertiary">
                {f.meta}
              </div>
            )}
          </Card>
        );
        return f.href ? (
          <Link key={f.title} href={f.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={f.title}>{inner}</div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Stats / checklist / steps
 * ------------------------------------------------------------------ */

export function StatBand({
  items,
}: {
  items: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[var(--border-strong)] bg-[var(--border-strong)] lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="bg-[var(--bg-elevated)] px-6 py-7">
          <div className="font-serif text-[2.25rem] leading-none text-primary">{s.value}</div>
          <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-secondary">
            {s.label}
          </div>
          {s.hint && <div className="mt-1.5 text-[12px] text-tertiary">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-dense text-primary">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-good bg-good-soft text-good">
            <Icon name="check" className="size-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function StepList({
  steps,
}: {
  steps: { n: string; title: string; body: string; meta?: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-[var(--border-strong)] bg-[var(--border-strong)] lg:grid-cols-3">
      {steps.map((s) => (
        <article key={s.n} className="flex flex-col gap-4 bg-[var(--bg-elevated)] p-6">
          <span className="font-mono text-[11px] tracking-[0.14em] text-accent">{s.n}</span>
          <h3 className="font-serif text-[1.4rem] leading-snug text-primary">{s.title}</h3>
          <p className="text-dense text-secondary">{s.body}</p>
          {s.meta && (
            <div className="mt-auto border-t border-hairline pt-4 font-mono text-[10.5px] leading-relaxed text-tertiary">
              {s.meta}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Call-to-action band
 * ------------------------------------------------------------------ */

export function CTASection({
  eyebrow = "Get started",
  title,
  body,
  primary = { label: "Open the console", href: "/assistant" },
  secondary = { label: "Read the docs", href: "/docs" },
  note,
}: {
  eyebrow?: string;
  title: ReactNode;
  body: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  note?: string;
}) {
  return (
    <section className="border-t border-hairline bg-[var(--bg-subtle)]">
      <div className="shell py-20">
        <div className="grad-card relative overflow-hidden rounded-[2rem] px-7 py-14 sm:px-14 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full bg-[var(--accent-soft)] blur-3xl"
          />
          <div className="relative z-10 grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div>
              <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[13px] font-medium text-white/90">
                {eyebrow}
              </span>
              <h2 className="mt-5 text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]">
                {title}
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <p className="max-w-prose text-[1.0625rem] leading-relaxed text-white/80">
                {body}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={primary.href} className="btn-light">
                  {primary.label}
                  <Icon name="arrow" className="size-4" />
                </Link>
                <Link href={secondary.href} className="btn-glass">
                  {secondary.label}
                </Link>
              </div>
              {note && (
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/55">
                  {note}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Roadmap list (for planned surfaces)
 * ------------------------------------------------------------------ */

export function RoadmapList({
  items,
}: {
  items: { milestone: string; title: string; body: string; done?: boolean }[];
}) {
  return (
    <ol className="relative space-y-3 border-l border-[var(--border-strong)] pl-6">
      {items.map((it) => (
        <li key={it.milestone} className="relative">
          <span
            className={`absolute -left-[1.8125rem] top-1.5 size-3 rounded-full border-2 border-[var(--bg-elevated)] ${
              it.done ? "bg-good" : "bg-[var(--text-subtle)]"
            }`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              {it.milestone}
            </span>
            <span className="text-dense-lg font-medium text-primary">{it.title}</span>
          </div>
          <p className="mt-1 max-w-prose text-dense text-tertiary">{it.body}</p>
        </li>
      ))}
    </ol>
  );
}
