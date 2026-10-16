import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Icon, Section, StatusTag } from "@/components/ui";

const PROGRAMS = [
  {
    icon: "users" as const,
    title: "Design partners",
    body: "A small group of platform and SRE teams who use SRE Copilot on real incidents and shape the roadmap directly. Weekly feedback, early access to each milestone.",
    meta: "early access · direct roadmap input",
  },
  {
    icon: "compass" as const,
    title: "Pilot teams",
    body: "Teams who want a read-only diagnosis layer alongside their existing observability stack, with a clear evaluation period before any commitment.",
    meta: "read-only · no production writes",
  },
];

export default function CustomersPage() {
  return (
    <>
      <PageShell
        eyebrow="Customers"
        title="Early access, honestly labeled"
        subtitle="SRE Copilot is an early product. We do not publish logos we have not earned or quotes we cannot attribute. This page describes the program we are running now and what will replace it as partners ship."
        aside={<StatusTag status="partial" milestone="early access" />}
        actions={
          <>
            <Link href="/support" className="btn-accent">
              Join the program
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/customers/case-studies" className="btn-ghost">
              Case studies
            </Link>
          </>
        }
      >
        <Section
          eyebrow="Program"
          title="How teams work with us right now"
          lead="No fabricated customer wall. If you want to use SRE Copilot on real infrastructure, this is the honest path."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROGRAMS.map((p) => (
              <Card key={p.title} hover className="flex flex-col gap-4 p-6">
                <span className="grid size-10 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h3 className="font-serif text-xl text-paper-50">{p.title}</h3>
                  <p className="mt-2 text-dense text-paper-300">{p.body}</p>
                </div>
                <div className="mt-auto border-t border-hairline pt-4 font-mono text-[10.5px] text-paper-400">
                  {p.meta}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="What ships next"
          title="Where real customer stories will live"
          lead="As partners complete pilots, their results — including numbers we can defend — will replace the placeholders here."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/customers/case-studies" className="block">
              <Card hover className="flex items-center justify-between p-6">
                <div>
                  <div className="font-serif text-lg text-paper-50">Case studies</div>
                  <p className="mt-1 text-dense text-paper-400">Problem, approach, measured result.</p>
                </div>
                <Icon name="arrow" className="size-5 text-amber-500" />
              </Card>
            </Link>
            <Link href="/customers/testimonials" className="block">
              <Card hover className="flex items-center justify-between p-6">
                <div>
                  <div className="font-serif text-lg text-paper-50">Testimonials</div>
                  <p className="mt-1 text-dense text-paper-400">Quotes from real users, attributed.</p>
                </div>
                <Icon name="arrow" className="size-5 text-amber-500" />
              </Card>
            </Link>
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Be an early
            <br />
            design partner.
          </>
        }
        body="Tell us what you run and what keeps breaking. We will be explicit about what works today and what is still on the roadmap."
        primary={{ label: "Talk to us", href: "/support" }}
        secondary={{ label: "See the roadmap", href: "/changelog" }}
        note="no production writes · read-only by default"
      />
    </>
  );
}
