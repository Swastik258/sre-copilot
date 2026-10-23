import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/platform" },
  title: "Platform teams — Tarn",
  description:
    "Standardize evidence-backed diagnosis across the platform with a read-only contract.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Solutions / Platform teams</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Standardize how incidents get diagnosed.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        When every cluster, service, and pipeline speaks a different dialect,
        diagnosis becomes tribal knowledge. Tarn gives platform teams one
        read-only, evidence-backed way to explain a failure across everything
        they run.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <span className="label-caps">One contract</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            The same evidence shape everywhere
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Kubernetes, logs, CI/CD, Terraform, and Prometheus all emit the same
            structured, citable evidence. Generated infrastructure changes stay
            proposal-only.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Read-only</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            The safe path is the only path
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            The Kubernetes client has no mutating methods, enforced by tests.
            Diagnosis never changes the cluster it is inspecting.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/solutions" className="btn-ghost">
          Back to solutions
        </Link>
        <Link href="/assistant" className="btn-accent">
          Start an investigation
        </Link>
      </div>
    </div>
  );
}
