import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusText } from "@/components/editorial";

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
    <article className="shell">
      <PageHeader
        label="Security"
        title="What is protected, and what is not."
        lead="Tarn is a self-hosted product, not a certified platform. The controls below are implemented and tested; the gaps below are real. Review both against your own risk model before exposing a deployment."
        meta={<StatusText state="warn">No certification claimed</StatusText>}
        actions={
          <>
            <Link href="/docs#security" className="btn-primary">
              Read the security docs
            </Link>
            <Link href="/support" className="btn-ghost">
              Report a vulnerability
            </Link>
          </>
        }
      />

      <div className="ledger-grid">
        <section>
          <p className="section-label">Controls in place</p>
          <h2 className="mt-3">Implemented, and covered by tests.</h2>
          <ul>
            {CONTROLS.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </section>
        <section>
          <p className="section-label">Honest gaps</p>
          <h2 className="mt-3">Not implemented. Not implied.</h2>
          <ul>
            {GAPS.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-6 text-[var(--text-subtle)]">
            Production always requires authentication. A deployment still needs
            its own monitoring, backup, key-management, and incident-response
            procedures.
          </p>
        </section>
      </div>

      <div className="rail-section">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Deployment boundary</p>
            <p>
              The operator owns the host, the network, the credentials, the
              database, and the decision to expose the app.
            </p>
          </aside>
          <div className="rail-section__body">
            <h2>Security is a shared boundary, not a badge.</h2>
            <p>
              Tarn removes entire classes of risk by keeping infrastructure
              adapters read-only and by giving the language model no tools. It
              cannot remove the risks that belong to the deployment: weak
              operator credentials, an exposed database, an unpatched host, or a
              missing backup.
            </p>
            <p>
              The repository includes hardening notes for production, but a
              passing build is not a security audit. If you need a formal
              assurance program, commission one against your deployment.
            </p>
            <div className="surface-detail-actions">
              <Link href="/docs#security" className="link-editorial">
                Security implementation notes
              </Link>
              <Link href="/support">Report a vulnerability</Link>
              <Link href="/privacy">Read the privacy page</Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
