import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support — SRE Copilot",
  description:
    "Documentation, contact, and security disclosure information for SRE Copilot.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Support</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Ask a specific question. Get a specific answer.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        This is a reference implementation, so support is best-effort. Include
        the surface, the failing state, and the evidence you expected to see.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-8">
          <span className="label-caps">Documentation</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Start with the docs
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Local setup, API behavior, security controls, and the Kubernetes
            adapter are documented before you file a question.
          </p>
          <Link href="/docs" className="btn-ghost mt-6">
            Read the docs
          </Link>
        </div>

        <div className="card p-8">
          <span className="label-caps">Contact</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Email support
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Bug reports, design-partner requests, and security disclosures can
            go to the same address. Do not include secrets or production
            payloads.
          </p>
          <a href="mailto:hello@srecopilot.dev" className="btn-accent mt-6">
            hello@srecopilot.dev
          </a>
        </div>
      </div>

      <div className="card mt-4 p-8">
        <span className="label-caps">Security</span>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          For a vulnerability, include the affected endpoint or component, a
          minimal reproduction, and the impact you believe is possible. Do not
          test against systems you do not own.
        </p>
        <Link href="/security" className="link-editorial mt-4 inline-block text-sm">
          Read the security page
        </Link>
      </div>
    </div>
  );
}
