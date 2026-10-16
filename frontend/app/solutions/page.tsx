import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Eyebrow, Icon, Section } from "@/components/ui";

const AUDIENCES = [
  {
    href: "/solutions/platform",
    icon: "layers" as const,
    title: "Platform teams",
    body: "Standardize how incidents get diagnosed across many clusters and services, with one evidence model and one read-only guarantee.",
  },
  {
    href: "/solutions/sre",
    icon: "life" as const,
    title: "SRE & on-call",
    body: "Cut mean-time-to-understanding. Get to the evidence behind a failing pod or pipeline in seconds, without a dozen tabs.",
  },
  {
    href: "/solutions/devops",
    icon: "cicd" as const,
    title: "DevOps",
    body: "Review pipeline failures and infrastructure changes before they reach production, with explanations a reviewer can follow.",
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageShell
        eyebrow="Solutions"
        title="Built for the people who get paged"
        subtitle="SRE Copilot is a read-only diagnosis layer for the teams responsible for reliability. It does not replace your observability stack — it explains what is in it, with evidence."
        actions={
          <>
            <Link href="/assistant" className="btn-accent">
              Open the console
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/product" className="btn-ghost">
              See the product
            </Link>
          </>
        }
      >
        <Section eyebrow="Audiences" title="One console, three jobs to be done" lead="The same evidence model serves very different day-to-day problems. Pick the lens that matches your role.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AUDIENCES.map((a) => (
              <Link key={a.href} href={a.href} className="block">
                <Card hover className="flex h-full flex-col gap-4 p-6">
                  <span className="grid size-10 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                    <Icon name={a.icon} />
                  </span>
                  <h3 className="font-serif text-xl text-paper-50">{a.title}</h3>
                  <p className="text-dense text-paper-300">{a.body}</p>
                  <span className="mt-auto flex items-center gap-2 pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-amber-500">
                    Explore
                    <Icon name="arrow" className="size-3.5" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Principles"
          title="The same guarantees for everyone"
          lead="Whichever team uses it, the product behaves the same way: read-only by default, evidence before conclusions, and human approval before any change."
        >
          <div className="grid grid-cols-1 gap-6 border-t border-hairline pt-8 sm:grid-cols-3">
            {[
              { t: "Read-only", d: "Connectors list and read. They never change state on their own." },
              { t: "Evidence-first", d: "Facts and hypotheses are always separated and cited." },
              { t: "Approval-gated", d: "Any remediation is proposed, reversible, and human-approved." },
            ].map((x) => (
              <div key={x.t}>
                <Eyebrow>{x.t}</Eyebrow>
                <p className="mt-4 text-dense text-paper-300">{x.d}</p>
              </div>
            ))}
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Fewer tabs.
            <br />
            More evidence.
          </>
        }
        body="Run the demo locally and diagnose a failing pod in under a minute — no cluster, no key, no cloud account."
        primary={{ label: "Open Kubernetes diagnostics", href: "/kubernetes" }}
        secondary={{ label: "See the product", href: "/product" }}
        note="demo fixtures · clearly labelled"
      />
    </>
  );
}
