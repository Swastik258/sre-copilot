import type { Metadata } from "next";
import Link from "next/link";
import { ContourField } from "@/components/ContourField";
import { PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/product" },
  title: "Product — Tarn",
  description:
    "Kubernetes, logs, CI/CD, Terraform, the assistant, and audit: evidence-backed diagnosis for production operations.",
};

const SURFACES = [
  {
    slug: "kubernetes",
    title: "Kubernetes",
    body: "Read-only diagnosis of unhealthy pods and workloads, with cited observations and review-only next steps.",
    reads: "Pod status, events, previous logs",
    status: "Live",
  },
  {
    slug: "logs",
    title: "Logs",
    body: "Group and deduplicate log streams, surface the first occurrence, and redact secrets before evidence is returned.",
    reads: "Bounded pasted log streams",
    status: "Live",
  },
  {
    slug: "cicd",
    title: "CI/CD",
    body: "Explain a failed GitHub Actions run, pinpoint the failing step, and show the triggering branch and commit.",
    reads: "Workflow runs, jobs, steps",
    status: "Live",
  },
  {
    slug: "terraform",
    title: "Terraform",
    body: "Turn a supplied plan into plain language, flag destructive changes, and show the blast radius before apply.",
    reads: "A supplied plan or state",
    status: "Live",
  },
  {
    slug: "assistant",
    title: "AI Assistant",
    body: "Ask why in plain language. Responses use evidence already attached to the investigation and separate facts from hypotheses. The model has no tool access.",
    reads: "The attached evidence set",
    status: "Live · provider optional",
  },
  {
    slug: "audit",
    title: "Audit",
    body: "A durable trail of what was asked, the policy decision recorded, and the redacted outcome.",
    reads: "Policy and investigation events",
    status: "Live",
  },
  {
    slug: "metrics",
    title: "Metrics",
    body: "Review bounded Prometheus signals alongside operational events without confusing correlation for causation.",
    reads: "Bounded Prometheus queries",
    status: "Live",
  },
  {
    slug: "runbooks",
    title: "Runbooks",
    body: "Find read-only triage guidance organized around symptoms and operational areas.",
    reads: "Checked-in runbook content",
    status: "Live",
  },
  {
    slug: "infra-code",
    title: "Infrastructure Code",
    body: "Generate reviewable infrastructure proposals with reliability and security defaults.",
    reads: "Requested resource shape",
    status: "Live · proposal only",
  },
];

const COMMON = [
  {
    title: "One evidence contract",
    body:
      "Every surface returns observations, evidence references, ranked hypotheses, and review-only next steps. The shape does not change because the source did.",
  },
  {
    title: "Source limits stay visible",
    body:
      "If metrics, GitHub, or a live cluster are not configured, the gap is named. Tarn does not turn missing evidence into a confident answer.",
  },
  {
    title: "No implicit execution",
    body:
      "The Kubernetes client exposes no mutating methods. Terraform analysis never runs plan or apply. GitHub analysis never re-runs or cancels a workflow.",
  },
];

export default function Page() {
  return (
    <article className="product-index-page">
      <div className="shell">
        <PageHeader
          label="Product"
          title="Nine surfaces. One evidence model."
          lead="Every surface starts with a read-only source and ends with the same shape: what was observed, which payload supports it, what remains uncertain, and what an operator might check next."
          meta={<span>Read-only by construction</span>}
          actions={
            <>
              <Link href="/demo" className="btn-primary">
                Try the public fixture
              </Link>
              <Link href="/docs" className="btn-ghost">
                Read the docs
              </Link>
            </>
          }
        />
      </div>

      <section className="product-ledger" aria-labelledby="product-surfaces-title">
        <div className="shell product-ledger__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Implemented surfaces</p>
            <p>
              Live infrastructure data requires operator-configured read-only
              credentials. Fixtures remain labelled as demo data.
            </p>
          </aside>
          <div className="product-ledger__body">
            <h2 id="product-surfaces-title">What each surface reads.</h2>
            <div className="table-scroll">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th scope="col">Surface</th>
                    <th scope="col">Reads</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SURFACES.map((surface) => (
                    <tr key={surface.slug}>
                      <td data-label="Surface">
                        <Link href={`/product/${surface.slug}`}>
                          {surface.title}
                        </Link>
                      </td>
                      <td data-label="Reads">{surface.reads}</td>
                      <td data-label="Status">
                        <StatusText
                          state={surface.status.includes("optional") ? "demo" : "live"}
                        >
                          {surface.status}
                        </StatusText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="status-legend">
              <span>Live means implemented in this repository.</span>
              <span>Provider optional means deterministic output still works without an AI key.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="product-brief-section" aria-labelledby="common-contract-title">
        <div className="shell product-brief">
          <div>
            <p className="section-label">The common contract</p>
            <h2 id="common-contract-title">Different sources. Same burden of proof.</h2>
          </div>
          <div className="product-brief__body">
            {COMMON.map((item) => (
              <div key={item.title} className="border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
                <h3 className="text-base font-medium">{item.title}</h3>
                <p className="mt-2">{item.body}</p>
              </div>
            ))}
            <div className="surface-detail-actions">
              <Link href="/security" className="link-editorial">
                Inspect the security boundaries
              </Link>
              <Link href="/pricing">See what is purchasable</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta" data-theme="ink" aria-labelledby="product-cta-title">
        <ContourField className="home-cta__contour" rings={8} />
        <div className="shell home-cta__inner">
          <div>
            <h2 id="product-cta-title">Start with a surface you can inspect.</h2>
            <p>
              The public demo runs saved rules-engine output against a labelled
              Kubernetes fixture. No account, source credential, or provider key
              is required.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/demo" className="btn-primary">
              Open the demo
            </Link>
            <Link href="/docs" className="btn-glass">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
