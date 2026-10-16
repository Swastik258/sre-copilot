import { PageShell } from "@/components/PageShell";
import { CTASection, Card, Icon, Section } from "@/components/ui";

const IMPLEMENTED = [
  "Read-only Kubernetes adapter with no mutating methods — enforced by a test.",
  "Server-side redaction of credentials, tokens, and private keys before storage or model use.",
  "Request-size limits and optional per-client rate limiting.",
  "Structured logs with request ids and a uniform JSON error envelope.",
  "Demo data labeled end to end with a demo flag.",
  "Secrets read on the backend only; never embedded in the frontend bundle.",
];

const MISSING = [
  "Backend authentication and authorization (the UI can gate, the API does not yet).",
  "Per-user scoping and workspace isolation.",
  "Secret storage and rotation for connected integrations.",
  "Egress controls for hosted AI providers beyond privacy mode.",
];

export default function SecurityPage() {
  return (
    <>
      <PageShell
        eyebrow="Security"
        title="What is protected now, and what is not"
        subtitle="A security page that only lists strengths is not useful. This one states exactly which controls are implemented and which are still missing, so you can decide what is safe to run."
      >
        <Section eyebrow="Implemented" title="Controls in place today" lead="These are enforced in code and exercised by tests.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {IMPLEMENTED.map((c) => (
              <Card key={c} className="flex items-start gap-3 p-5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                  <Icon name="check" className="size-3" />
                </span>
                <span className="text-dense text-paper-200">{c}</span>
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Not yet" title="Controls still missing" lead="Do not expose the API to the public internet until these are addressed. The local demo does not need them.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MISSING.map((c) => (
              <Card key={c} className="flex items-start gap-3 p-5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700">
                  <Icon name="bolt" className="size-3" />
                </span>
                <span className="text-dense text-paper-200">{c}</span>
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Report" title="Reporting a vulnerability" lead="If you find a security issue, please do not open a public issue.">
          <Card className="p-6">
            <p className="text-dense text-paper-300">
              Contact the maintainers privately with the details and a reproduction.
              We will acknowledge, investigate, and credit responsible disclosure when
              a fix ships.
            </p>
          </Card>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Safe by
            <br />
            default.
          </>
        }
        body="Read-only by construction is what makes it safe to point at production. Run the local demo to see it without connecting anything."
        primary={{ label: "Try the demo", href: "/kubernetes" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
