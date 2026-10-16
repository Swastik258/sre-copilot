import { PageShell } from "@/components/PageShell";
import { CTASection, Card, Section } from "@/components/ui";

const TERMS = [
  {
    t: "Early-access software",
    d: "SRE Copilot is pre-1.0 software provided as-is for evaluation. Features may change, break, or be removed, and behavior is documented per milestone.",
  },
  {
    t: "Read-only by design",
    d: "The connectors read from your systems. They do not change cluster, pipeline, or cloud state on their own. Any proposed change requires explicit human approval.",
  },
  {
    t: "Your credentials",
    d: "You supply your own integration and provider credentials. Keep them scoped to the minimum required and revoke them when you stop using the tool.",
  },
  {
    t: "Your responsibility",
    d: "A diagnosis is decision support, not a guarantee. You remain responsible for changes you make based on it, and for reviewing evidence before acting.",
  },
  {
    t: "No warranty",
    d: "The software is provided without warranty. Do not rely on it as your only safeguard for production reliability.",
  },
  {
    t: "Open source",
    d: "The source is available in the project repository. Use it under the terms stated there.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageShell
        eyebrow="Terms"
        title="Terms for early access"
        subtitle="Plain-language terms for using SRE Copilot during early access. They describe the current build honestly rather than promising a finished product."
      >
        <Section>
          <div className="space-y-4">
            {TERMS.map((t) => (
              <Card key={t.t} className="p-6">
                <h2 className="font-serif text-lg text-paper-50">{t.t}</h2>
                <p className="mt-2 text-dense text-paper-300">{t.d}</p>
              </Card>
            ))}
          </div>

          <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
            Last updated for milestone 2 · this page describes the current build
          </p>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Evaluate it
            <br />
            on your terms.
          </>
        }
        body="Run the demo locally, read the security notes, and decide for yourself what is safe to connect."
        primary={{ label: "Open the console", href: "/assistant" }}
        secondary={{ label: "Security notes", href: "/security" }}
      />
    </>
  );
}
