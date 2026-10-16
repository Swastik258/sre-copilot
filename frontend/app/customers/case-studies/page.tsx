import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, CTASection, Icon, RoadmapList, Section } from "@/components/ui";

const CHECKLIST = [
  { milestone: "Context", title: "The environment", body: "What the team runs — cluster scale, pipelines, IaC — and how they diagnosed incidents before SRE Copilot." },
  { milestone: "Problem", title: "The failure that drove adoption", body: "A concrete incident class: crash loops, OOM kills, flaky pipelines, risky plans." },
  { milestone: "Approach", title: "How they used it", body: "What they connected, what is read-only, and how diagnosis fits their on-call workflow." },
  { milestone: "Result", title: "A measured outcome", body: "A number we can defend — time to first evidence, incidents diagnosed, or review time saved." },
];

export default function CaseStudiesPage() {
  return (
    <>
      <PageShell
        eyebrow="Customers / Case studies"
        title="Case studies, once they are real"
        subtitle="We will publish a case study only when a design partner has used SRE Copilot on real incidents and agrees to share the result — including the number. Until then, this page shows exactly what a study will contain."
        actions={
          <>
            <Link href="/customers" className="btn-ghost">
              Back to customers
            </Link>
            <Link href="/support" className="btn-accent">
              Become a partner
              <Icon name="arrow" className="size-4" />
            </Link>
          </>
        }
      >
        <Section
          eyebrow="Template"
          title="What every case study will include"
          lead="No vanity metrics and no anonymous 'a large enterprise'. Each study names the shape of the problem and the measured change."
        >
          <RoadmapList
            items={CHECKLIST.map((c) => ({
              milestone: c.milestone,
              title: c.title,
              body: c.body,
            }))}
          />
        </Section>

        <Section eyebrow="Status" title="Why this page is empty" lead="An honest empty state beats a fabricated one.">
          <Card className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-serif text-xl text-paper-50">No published studies yet</h3>
              <p className="mt-2 max-w-prose text-dense text-paper-300">
                SRE Copilot is in early access. As partners complete pilots, their
                studies will appear here with the team named and the result
                measured. You can read the roadmap in the meantime.
              </p>
            </div>
            <Link href="/changelog" className="btn-ghost shrink-0">
              View the changelog
            </Link>
          </Card>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Write the first
            <br />
            case study with us.
          </>
        }
        body="Join the design-partner program, run SRE Copilot on a real incident class, and help define what evidence-first diagnosis looks like."
        primary={{ label: "Join the program", href: "/support" }}
        secondary={{ label: "See the product", href: "/product" }}
      />
    </>
  );
}
