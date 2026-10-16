import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import {
  CTASection,
  FeatureGrid,
  Icon,
  RoadmapList,
  Section,
  StatusTag,
  type Feature,
} from "@/components/ui";

export type SurfaceConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  status: "live" | "planned" | "partial";
  milestone: string;
  preview?: ReactNode;
  previewLabel?: string;
  capabilitiesTitle: string;
  capabilities: Feature[];
  roadmapTitle?: string;
  roadmapLead?: string;
  roadmap: { milestone: string; title: string; body: string; done?: boolean }[];
  ctaTitle: ReactNode;
  ctaBody: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  ctaNote?: string;
};

/**
 * Shared layout for a product surface page. Used by both shipped (Kubernetes)
 * and planned surfaces so every page reads the same and states its status
 * plainly instead of implying unbuilt features already work.
 */
export function SurfacePage({ config }: { config: SurfaceConfig }) {
  return (
    <>
      <PageShell
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={config.subtitle}
        aside={<StatusTag status={config.status} milestone={config.milestone} />}
        actions={
          <>
            <Link href="/docs" className="btn-ghost">
              Read the docs
            </Link>
            <Link href="/support" className="btn-accent">
              Talk to us
              <Icon name="arrow" className="size-4" />
            </Link>
          </>
        }
      >
        {config.preview && (
          <section className="border-b border-hairline">
            <div className="shell py-16">
              <div className="mb-5 flex items-center justify-between">
                <span className="label-caps">
                  {config.previewLabel ?? "Preview · labelled sample data"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper-400">
                  illustrative
                </span>
              </div>
              {config.preview}
            </div>
          </section>
        )}

        <Section
          eyebrow="Capabilities"
          title={config.capabilitiesTitle}
          lead="Planned capabilities are shown so you can see the direction. Nothing below is claimed as working until the milestone that ships it is merged and tested."
        >
          <FeatureGrid items={config.capabilities} columns={2} />
        </Section>

        <Section
          eyebrow="Roadmap"
          title={config.roadmapTitle ?? "Where this lands"}
          lead={config.roadmapLead}
        >
          <RoadmapList items={config.roadmap} />
        </Section>
      </PageShell>

      <CTASection
        title={config.ctaTitle}
        body={config.ctaBody}
        primary={config.primary}
        secondary={config.secondary}
        note={config.ctaNote}
      />
    </>
  );
}
