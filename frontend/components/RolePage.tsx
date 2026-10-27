import Link from "next/link";
import { StatusText } from "@/components/editorial";

export type RolePageConfig = {
  label: string;
  title: string;
  lead: string;
  patternLabel: string;
  patternTitle: string;
  patternLead: string;
  steps: { mark: string; title: string; body: string }[];
  boundariesTitle: string;
  boundaries: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

export function RolePage({ config }: { config: RolePageConfig }) {
  return (
    <article className="shell solution-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/solutions">Solutions</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{config.label}</span>
      </nav>

      <section className="solution-hero">
        <div>
          <p className="section-label">{config.label}</p>
          <h1 className="mt-4">{config.title}</h1>
          <p className="solution-hero__lead">{config.lead}</p>
          <div className="page-actions">
            <Link href={config.primary.href} className="btn-primary">
              {config.primary.label}
            </Link>
            <Link href={config.secondary.href} className="btn-ghost">
              {config.secondary.label}
            </Link>
          </div>
        </div>
        <aside className="surface-hero__note">
          <StatusText state="live">Read-only investigation</StatusText>
          <p className="mt-4">
            The same evidence contract applies across clusters, logs, pipelines,
            and plans. No surface has an apply, exec, or re-run path.
          </p>
        </aside>
      </section>

      <section className="rail-section" aria-labelledby="role-pattern-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">{config.patternLabel}</p>
            <p>{config.patternLead}</p>
          </aside>
          <div className="rail-section__body">
            <h2 id="role-pattern-title">{config.patternTitle}</h2>
            <ol className="solution-sequence mt-8">
              {config.steps.map((step) => (
                <li key={step.title}>
                  <span className="solution-sequence__mark">{step.mark}</span>
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="rail-section" aria-labelledby="role-boundaries-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Limits</p>
            <p>What this role page does not claim.</p>
          </aside>
          <div className="rail-section__body">
            <h2 id="role-boundaries-title">{config.boundariesTitle}</h2>
            <ul className="boundaries-list">
              {config.boundaries.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="surface-detail-actions">
              <Link href="/security" className="link-editorial">
                Read the security model
              </Link>
              <Link href="/demo">Open the public fixture</Link>
              <Link href="/solutions">All solutions</Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
