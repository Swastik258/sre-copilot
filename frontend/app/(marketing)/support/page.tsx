import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  title: "Support — Tarn",
  description:
    "Documentation, contact, and security disclosure information for Tarn.",
};

const configuredSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
const supportEmail =
  configuredSupportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredSupportEmail)
    ? configuredSupportEmail
    : null;

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Support</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Ask a specific question. Get a specific answer.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Support is operated per deployment. Include the surface, the failing
        state, and the evidence you expected to see. Never include credentials
        or production payloads.
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
          {supportEmail ? (
            <>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Bug reports, design-partner requests, and security disclosures
                can go to the address configured by this deployment. Do not
                include secrets or production payloads.
              </p>
              <a href={`mailto:${supportEmail}`} className="btn-accent mt-6">
                {supportEmail}
              </a>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              No public support address is configured for this deployment. Set
              <code className="mx-1 font-mono">NEXT_PUBLIC_SUPPORT_EMAIL</code>
              before publishing, or contact the operator through your internal
              support channel.
            </p>
          )}
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
