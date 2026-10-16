import { PageShell } from "@/components/PageShell";
import { CTASection, Card, Section } from "@/components/ui";

const POINTS = [
  {
    t: "What we process",
    d: "When you connect an integration, we read the minimum needed to diagnose a failure: pod status, events, container logs, workflow runs, or a Terraform plan. Read operations only.",
  },
  {
    t: "Redaction",
    d: "Credentials, bearer tokens, passwords, and private keys are stripped server-side before anything is stored, logged, or sent to a model. Raw secrets do not reach the audit log.",
  },
  {
    t: "Local-first",
    d: "The entire stack runs on your machine. Demo mode needs no account and no external calls. When you do enable an AI provider, you choose it explicitly.",
  },
  {
    t: "Privacy mode",
    d: "With AI privacy mode on, investigation content is never sent to an external provider — the call is rejected at runtime rather than merely discouraged.",
  },
  {
    t: "No training on your data",
    d: "Your investigations are not used to train models. Uploads are scoped and can be removed.",
  },
  {
    t: "Demo data is labeled",
    d: "Fixture-backed records carry a demo flag through the API and into the UI, so sample data is never presented as production data.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageShell
        eyebrow="Privacy"
        title="Your infrastructure data stays yours"
        subtitle="This describes how SRE Copilot handles data in the current build. It is written to match the implementation; where a control is not yet built, the security page says so."
      >
        <Section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {POINTS.map((p) => (
              <Card key={p.t} className="p-6">
                <h2 className="font-serif text-lg text-paper-50">{p.t}</h2>
                <p className="mt-2 text-dense text-paper-300">{p.d}</p>
              </Card>
            ))}
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Local by
            <br />
            default.
          </>
        }
        body="Run the whole stack on your machine with no account and no external calls. Nothing leaves until you connect a provider."
        primary={{ label: "Read the docs", href: "/docs" }}
        secondary={{ label: "Security notes", href: "/security" }}
      />
    </>
  );
}
