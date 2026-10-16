import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Icon, Section } from "@/components/ui";

const HUBS = [
  { href: "/docs", icon: "book" as const, title: "Docs", body: "What is in the current build, the design, and how to run it locally." },
  { href: "/blog", icon: "chat" as const, title: "Blog", body: "Engineering notes on building an evidence-first diagnosis tool." },
  { href: "/changelog", icon: "graph" as const, title: "Changelog", body: "What shipped, milestone by milestone, with the tests behind it." },
  { href: "/support", icon: "life" as const, title: "Support", body: "How to report a bug, request a feature, or join the early-access program." },
];

export default function ResourcesPage() {
  return (
    <>
      <PageShell
        eyebrow="Resources"
        title="Everything you need to evaluate it"
        subtitle="Documentation, engineering notes, a changelog grounded in real milestones, and a direct line for feedback. No gated PDFs."
        actions={
          <>
            <Link href="/docs" className="btn-accent">
              Read the docs
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/support" className="btn-ghost">
              Get support
            </Link>
          </>
        }
      >
        <Section eyebrow="Browse" title="Start where you are" lead="Each hub is written for a different question — what it is, how it is built, what changed, and how to get help.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {HUBS.map((h) => (
              <Link key={h.href} href={h.href} className="block">
                <Card hover className="flex h-full items-start gap-4 p-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                    <Icon name={h.icon} />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-paper-50">{h.title}</h3>
                    <p className="mt-1.5 text-dense text-paper-300">{h.body}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Run it before
            <br />
            you read about it.
          </>
        }
        body="The whole stack runs locally with no keys and no cluster. Diagnose a labelled demo failure, then read how it works."
        primary={{ label: "Open the console", href: "/kubernetes" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
