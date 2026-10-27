import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  lead,
  meta,
  actions,
  className = "",
  children,
}: {
  label?: string;
  title: string;
  lead?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={`page-masthead ${className}`.trim()}>
      <div className="page-masthead__meta">
        {label ? <span>{label}</span> : null}
        {meta}
      </div>
      <div className="page-masthead__body">
        <h1>{title}</h1>
        {lead ? <p className="page-masthead__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
      {children}
    </header>
  );
}

export function RailSection({
  label,
  aside,
  children,
  className = "",
  tone = "paper",
}: {
  label?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "paper" | "ink";
}) {
  return (
    <section
      className={`rail-section rail-section--${tone} ${className}`.trim()}
      data-theme={tone}
    >
      <div className="shell rail-section__grid">
        <aside className="rail-section__margin">
          {label ? <p className="rail-section__label">{label}</p> : null}
          {aside}
        </aside>
        <div className="rail-section__body">{children}</div>
      </div>
    </section>
  );
}

export type StatusState =
  | "live"
  | "demo"
  | "disabled"
  | "planned"
  | "neutral"
  | "warn"
  | "error";

export function StatusText({
  children,
  state = "neutral",
  trailing,
}: {
  children: ReactNode;
  state?: StatusState;
  trailing?: ReactNode;
}) {
  return (
    <span className={`status-text status-text--${state}`}>
      <span className="status-text__word">{children}</span>
      {trailing ? <span className="status-text__trailing">{trailing}</span> : null}
    </span>
  );
}

export function LegalLayout({
  scope,
  lastReviewed,
  children,
}: {
  scope: string;
  lastReviewed: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-layout">
      <aside className="legal-layout__margin" aria-label="Document details">
        <p className="section-label">Document</p>
        <dl className="legal-facts">
          <div>
            <dt>Scope</dt>
            <dd>{scope}</dd>
          </div>
          <div>
            <dt>Last reviewed</dt>
            <dd>
              <time dateTime={lastReviewed}>{lastReviewed}</time>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Working-copy template</dd>
          </div>
        </dl>
      </aside>
      <div className="legal-prose">{children}</div>
    </div>
  );
}

export function EvidenceRef({ children }: { children: ReactNode }) {
  return <span className="evidence-ref">{children}</span>;
}

export function DepthScale({
  items,
  compact = false,
}: {
  items: { mark: string; label: string; detail?: string }[];
  compact?: boolean;
}) {
  return (
    <div className={`depth-scale ${compact ? "depth-scale--compact" : ""}`.trim()}>
      {items.map((item) => (
        <div className="depth-scale__item" key={item.mark}>
          <span className="depth-scale__mark">{item.mark}</span>
          <span className="depth-scale__label">{item.label}</span>
          {item.detail ? <span className="depth-scale__detail">{item.detail}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  note,
  actions,
}: {
  title: string;
  body: string;
  note?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
      {note ? <p className="empty-state__note">{note}</p> : null}
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}
