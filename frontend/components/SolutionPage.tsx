import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import {
  CTASection,
  Card,
  FeatureGrid,
  Icon,
  Section,
  StatBand,
  type Feature,
} from "@/components/ui";

export type SolutionConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  problemsTitle: string;
  problems: { title: string; body: string }[];
  helpsTitle: string;
  helps: Feature[];
  outcomes: { value: string; label: string; hint?: string }[];
  ctaTitle: ReactNode;
  ctaBody: string;
};

export function SolutionPage({ config }: { config: SolutionConfig }) {
  return (
    <>
      <PageShell
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={config.subtitle}
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
        <Section eyebrow="The problem" title={config.problemsTitle} lead="The failure modes are familiar. What is usually missing is a shared, evidence-backed account of what actually happened.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {config.problems.map((p) => (
              <Card key={p.title} className="p-6">
                <h3 className="font-serif text-lg text-primary">{p.title}</h3>
                <p className="mt-2 text-dense text-secondary">{p.body}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="How SRE Copilot helps"
          title={config.helpsTitle}
          lead="Every capability keeps the same contract: read-only calls, cited evidence, and a clear separation between facts and hypotheses."
        >
          <FeatureGrid items={config.helps} columns={2} />
        </Section>

        <Section eyebrow="Outcomes" title="What teams get" lead="Illustrative targets for how read-only, evidence-first diagnosis changes the shape of on-call work.">
          <StatBand items={config.outcomes} />
        </Section>
      </PageShell>

      <CTASection title={config.ctaTitle} body={config.ctaBody} />
    </>
  );
}
