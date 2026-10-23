import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/security" },
  title: "Security — Tarn",
  description:
    "The security controls that exist in Tarn, and the gaps that do not.",
};

const CONTROLS = [
  "Structurally read-only infrastructure adapters; generated code is proposal-only.",
  "Argon2id password hashing with rehashing of legacy hashes on sign-in.",
  "Hashed session tokens in HttpOnly, SameSite cookies with idle and absolute expiry.",
  "Owner, admin, member, and viewer roles with tenant-scoped queries and audit records.",
  "CSRF protection, trusted-proxy rate limits, idempotency, and request-size caps.",
  "Secret redaction before logs, evidence, audit records, or optional AI calls.",
  "Encrypted, retrying background jobs and configurable audit retention.",
  "CI gates for tests, coverage, static analysis, dependency audits, image builds, and manifests.",
];

const GAPS = [
  "No MFA, SSO, SAML, or SCIM.",
  "No SOC 2, ISO 27001, or third-party penetration-test claim.",
  "Rate limiting is per process; use an edge or shared limiter for multiple replicas.",
  "Job encryption uses an operator-managed key, not KMS/HSM rotation.",
  "No DNS pinning or network egress allow-list is enforced by the app.",
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Security</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        What is protected, and what is not.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Tarn is a self-hosted product, not a certified platform. The
        controls below are implemented and tested; the gaps below are real.
        Review them against your own risk model before exposing a deployment.
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
            Production always requires authentication. A deployment still needs
            its own monitoring, backup, key-management, and incident-response
            procedures.
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
