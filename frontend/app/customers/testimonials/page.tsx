import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Icon, Section } from "@/components/ui";

const ASKS = [
  { q: "Did the evidence match reality?", a: "We ask partners whether the cited facts actually explained the incident, and where the diagnosis was wrong or thin." },
  { q: "What was missing?", a: "Which piece of evidence would have made the answer faster — a metric, an event, a specific log line." },
  { q: "Would you page with it?", a: "Whether the read-only next steps are things an on-call engineer would actually run at 03:00." },
];

export default function TestimonialsPage() {
  return (
    <>
      <PageShell
        eyebrow="Customers / Testimonials"
        title="Quotes we can attribute, or none at all"
        subtitle="We do not invent testimonials. When partners are willing to be quoted — by name and role — their words will appear here. For now, this page explains how we ask for feedback."
        actions={
          <>
            <Link href="/customers" className="btn-ghost">
              Back to customers
            </Link>
            <Link href="/support" className="btn-accent">
              Share feedback
              <Icon name="arrow" className="size-4" />
            </Link>
          </>
        }
      >
        <Section
          eyebrow="How we ask"
          title="The three questions we put to every partner"
          lead="Feedback is structured so it is useful, not flattering. These are the questions behind every future quote on this page."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ASKS.map((a) => (
              <Card key={a.q} className="flex flex-col gap-3 p-6">
                <span className="grid size-9 place-items-center rounded-lg border border-hairline-strong bg-ink-800 text-amber-400">
                  <Icon name="chat" className="size-4" />
                </span>
                <h3 className="font-serif text-lg text-paper-50">{a.q}</h3>
                <p className="text-dense text-paper-300">{a.a}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Status" title="No published testimonials yet" lead="An empty, honest page is better than a wall of unverifiable praise.">
          <Card className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-dense text-paper-300">
              Partners are using SRE Copilot in early access. Quotes will be added
              with the person&apos;s name and role once they agree to be published.
            </p>
            <Link href="/changelog" className="btn-ghost shrink-0">
              View the changelog
            </Link>
          </Card>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Tell us where
            <br />
            it&apos;s wrong.
          </>
        }
        body="The most useful thing an early user can do is tell us when a diagnosis is misleading. That feedback shapes the rules directly."
        primary={{ label: "Share feedback", href: "/support" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
