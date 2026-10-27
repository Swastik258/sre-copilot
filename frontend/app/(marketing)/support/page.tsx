import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial";

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
    <article className="shell">
      <PageHeader
        label="Support"
        title="Ask a specific question. Get a specific answer."
        lead="Support is operated per deployment. Include the surface, the failing state, and the evidence you expected to see. Never include credentials or production payloads."
        meta={<span>Operator-run contact</span>}
        actions={
          <Link href="/docs" className="btn-primary">
            Start with the docs
          </Link>
        }
      />

      <div className="support-ledger">
        <section>
          <p className="section-label">Before you ask</p>
          <h2>Include the failure, not the whole incident.</h2>
          <p>
            The useful details are the surface you used, the exact state you
            expected, the evidence ID or request ID if one was shown, and a
            minimal reproduction. Redact anything that looks like a credential
            before you paste it.
          </p>
          <p className="mt-3 text-xs leading-6 text-[var(--text-subtle)]">
            Do not send production secrets, private keys, bearer tokens, or
            customer payloads through support.
          </p>
        </section>

        <section>
          <p className="section-label">Contact</p>
          <h2>{supportEmail ? "Email support" : "No public support address"}</h2>
          {supportEmail ? (
            <>
              <p>
                Bug reports, design-partner requests, and security disclosures
                can go to the address configured by this deployment. Do not
                include secrets or production payloads.
              </p>
              <a href={`mailto:${supportEmail}`} className="btn-primary">
                {supportEmail}
              </a>
            </>
          ) : (
            <p>
              No public support address is configured for this deployment.
              Contact the operator who runs this instance through your
              organization&rsquo;s internal support channel.
            </p>
          )}
        </section>

        <section className="support-disclosure">
          <p className="section-label">Security disclosure</p>
          <p>
            For a vulnerability, include the affected endpoint or component, a
            minimal reproduction, and the impact you believe is possible. Do not
            test against systems you do not own. Do not open a public issue with
            exploitable details.
          </p>
          <div className="surface-detail-actions">
            <Link href="/security" className="link-editorial">
              Read the security page
            </Link>
            <Link href="/docs">Documentation</Link>
          </div>
        </section>
      </div>
    </article>
  );
}
