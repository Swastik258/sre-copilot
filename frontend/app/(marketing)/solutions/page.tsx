import type { Metadata } from "next";
import Link from "next/link";
import { ContourField } from "@/components/ContourField";
import { PageHeader } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions" },
  title: "Solutions — Tarn",
  description:
    "Evidence-backed diagnosis for platform teams, SRE on-call, and DevOps review.",
};

const AUDIENCES = [
  {
    title: "Platform teams",
    body: "Standardize how incidents are diagnosed across clusters, services, and pipelines. One read-only evidence contract instead of tribal knowledge.",
    href: "/solutions/platform",
    label: "Platform engineering",
    note: "One evidence shape",
  },
  {
    title: "SRE on-call",
    body: "Get to the two or three facts that explain the page, with ranked hypotheses and cited next steps to review at 03:00.",
    href: "/solutions/sre",
    label: "Incident response",
    note: "Facts before the third tab",
  },
  {
    title: "DevOps",
    body: "Review failures and infrastructure changes before production. Explain the failing step or the destructive plan line before it becomes an incident.",
    href: "/solutions/devops",
    label: "Delivery review",
    note: "Pipeline and plan review",
  },
];

export default function Page() {
  return (
    <article>
      <div className="shell">
        <PageHeader
          label="Solutions"
          title="One diagnosis layer, three ways to use it."
          lead="Tarn is built for the people who have to explain a failure under time pressure. The same evidence model serves platform standards, on-call triage, and pre-production review."
          meta={<span>No customer outcome claims</span>}
          actions={
            <>
              <Link href="/demo" className="btn-primary">
                Open the public fixture
              </Link>
              <Link href="/product" className="btn-ghost">
                See the product
              </Link>
            </>
          }
        />
      </div>

      <section className="rail-section" aria-labelledby="solutions-ledger-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Who it is for</p>
            <p>
              Choose the operating context. The evidence contract stays the same;
              the useful next question changes.
            </p>
          </aside>
          <div className="rail-section__body">
            <h2 id="solutions-ledger-title">Where the work starts.</h2>
            <ol className="role-ledger mt-8">
              {AUDIENCES.map((audience) => (
                <li key={audience.title}>
                  <span className="role-ledger__role">{audience.label}</span>
                  <div>
                    <h2>{audience.title}</h2>
                    <p>{audience.body}</p>
                  </div>
                  <div className="role-ledger__link">
                    <p className="text-[var(--text-subtle)]">{audience.note}</p>
                    <Link href={audience.href} className="link-editorial mt-2 inline-block">
                      Read the solution
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="home-cta" data-theme="ink" aria-labelledby="solutions-cta-title">
        <ContourField className="home-cta__contour" rings={8} />
        <div className="shell home-cta__inner">
          <div>
            <h2 id="solutions-cta-title">Bring the evidence to the room.</h2>
            <p>
              The same diagnosis can be inspected by the person on call, the
              platform team, and the change author. No proof is manufactured
              between those views.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/demo" className="btn-primary">
              Open the demo
            </Link>
            <Link href="/support" className="btn-glass">
              Ask a specific question
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
