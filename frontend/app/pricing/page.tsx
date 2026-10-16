import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { CTASection, Card, CheckList, Eyebrow, Icon, Section } from "@/components/ui";

const ROWS: { feature: string; free: string; pro: string; team: string }[] = [
  { feature: "Demo mode with fixtures", free: "yes", pro: "yes", team: "yes" },
  { feature: "Local database, single user", free: "yes", pro: "yes", team: "yes" },
  { feature: "Bring your own AI key", free: "yes", pro: "yes", team: "yes" },
  { feature: "Kubernetes read-only access", free: "no", pro: "yes", team: "yes" },
  { feature: "GitHub Actions failure analysis", free: "no", pro: "yes", team: "yes" },
  { feature: "Saved investigations & history", free: "no", pro: "yes", team: "yes" },
  { feature: "Audit log with export", free: "no", pro: "yes", team: "yes" },
  { feature: "Seats", free: "1", pro: "1", team: "up to 10" },
  { feature: "Shared workspace", free: "no", pro: "no", team: "yes" },
  { feature: "SSO (SAML, OIDC)", free: "no", pro: "no", team: "yes" },
];

function Cell({ value }: { value: string }) {
  if (value === "yes")
    return (
      <span className="inline-grid size-5 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
        <Icon name="check" className="size-3" />
      </span>
    );
  if (value === "no") return <span className="text-paper-400">—</span>;
  return <span className="font-mono text-[11px] text-paper-300">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageShell
        eyebrow="Pricing"
        title="Read-only is free. You pay for reach."
        subtitle="Every tier keeps the same promise: no automated changes, no outbound writes, and a full audit trail. Paid tiers add connectors, seats, and shared workspace. No card is required for Free."
        actions={
          <>
            <Link href="/docs" className="btn-accent">
              Run it locally
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/support" className="btn-ghost">
              Talk to us
            </Link>
          </>
        }
      />

      {/* Tiers (reuse the home pricing component, without the duplicate header) */}
      <Pricing showHeader={false} />

      <Section eyebrow="Compare" title="Feature by feature" lead="The same guarantees sit underneath every tier. The differences are reach — how many connectors, seats, and shared features you get.">
        <div className="overflow-x-auto rounded-2xl border border-hairline-strong">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-ink-850">
                <th className="px-6 py-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                  Capability
                </th>
                {["Free", "Pro", "Team"].map((t) => (
                  <th
                    key={t}
                    className="px-6 py-4 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-200"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.feature} className={i % 2 ? "bg-ink-900" : "bg-ink-950/40"}>
                  <td className="border-t border-hairline px-6 py-3.5 text-dense text-paper-200">
                    {r.feature}
                  </td>
                  {[r.free, r.pro, r.team].map((v, j) => (
                    <td key={j} className="border-t border-hairline px-6 py-3.5 text-center">
                      <Cell value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Guarantees" title="What every tier includes" lead="These are enforced in code, not just listed here.">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <Eyebrow>Included</Eyebrow>
            <div className="mt-5">
              <CheckList
                items={[
                  "Read-only connectors — no writes without explicit approval",
                  "Redaction of secrets before storage or model use",
                  "Evidence-backed diagnoses with cited facts",
                  "Runs locally in demo mode with no keys",
                ]}
              />
            </div>
          </div>
          <Card className="p-6">
            <h3 className="font-serif text-lg text-paper-50">Why read-only is free</h3>
            <p className="mt-2 text-dense text-paper-300">
              Diagnosis is the part of the product we want everyone to have. It is safe
              to run against production because it cannot change it. Paying for reach —
              more connectors, more seats, shared workspace — keeps that guarantee
              intact at every level.
            </p>
          </Card>
        </div>
      </Section>

      <FAQ />

      <CTASection
        title={
          <>
            Start free,
            <br />
            with no key.
          </>
        }
        body="Demo mode needs no signup, no API key, and no cluster. Upgrade when you want to point it at real infrastructure."
        primary={{ label: "Open the console", href: "/assistant" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
        note="no card required for Free"
      />
    </>
  );
}
