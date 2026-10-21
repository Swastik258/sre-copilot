import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security — SRE Copilot",
  description:
    "The security controls that exist in SRE Copilot, and the gaps that do not.",
};

const CONTROLS = [
  "Read-only Kubernetes client with no mutating methods.",
  "Passwords hashed with scrypt.",
  "Session tokens stored hashed, delivered in an HttpOnly cookie.",
  "Secret redaction before logs and evidence are persisted.",
  "Uniform JSON error envelope across the API.",
  "Request IDs on API responses for traceability.",
];

const GAPS = [
  "No roles or per-resource authorization yet.",
  "No MFA.",
  "No email verification.",
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Security</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        What is protected, and what is not.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        SRE Copilot is a reference implementation, not a certified platform. The
        controls below are implemented; the gaps below are real and should be
        treated as blockers for a production deployment.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="card p-8">
          <span className="label-caps">Controls in place</span>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
            {CONTROLS.map((control) => (
              <li key={control} className="flex items-start gap-3">
                <span className="mt-0.5 text-[var(--signal-good)]">+</span>
                <span>{control}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-8">
          <span className="label-caps">Honest gaps</span>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
            {GAPS.map((gap) => (
              <li key={gap} className="flex items-start gap-3">
                <span className="mt-0.5 text-[var(--signal-warn)]">!</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-6 text-[var(--text-muted)]">
            API-wide authentication is available through configuration, but
            tenant isolation and role-based access are not implemented.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/docs#security" className="btn-accent">
          Read the security docs
        </Link>
        <Link href="/support" className="btn-ghost">
          Report a vulnerability
        </Link>
      </div>
    </div>
  );
}
