import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function TerraformPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "Terraform",
        title: "Know what a plan will destroy before you apply it",
        subtitle:
          "Turn a Terraform plan into plain language: what is created, changed, replaced, or destroyed, the blast radius of each replacement, and a review checklist for the risky ones.",
        status: "planned",
        milestone: "M6",
        previewLabel: "Preview · illustrative plan explanation",
        preview: (
          <PreviewPanel
            title="terraform · plan.json"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="space-y-1 font-mono text-[11.5px] leading-relaxed">
              <div className="text-signal-warn">
                <span className="opacity-70">-/+</span> aws_db_instance.primary{" "}
                <span className="text-paper-400">(replaced)</span>
              </div>
              <div className="pl-4 text-paper-400">~ engine_version: "15.4" → "15.6"</div>
              <div className="pl-4 text-paper-400">~ storage_gb: 100 → 200</div>
              <div className="pl-4 text-signal-bad">! replacement destroys primary before recreate</div>
              <div className="pt-2 text-signal-bad">
                <span className="opacity-70">-</span> aws_db_snapshot.legacy{" "}
                <span className="text-paper-400">(destroy)</span>
              </div>
              <div className="pt-2 text-[10.5px] text-paper-400">
                1 replacement · 1 deletion · 0 additions · high blast radius
              </div>
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What plan analysis will do",
        capabilities: [
          {
            icon: "terraform",
            title: "Explain every change",
            body: "Describe each create, update, replace, and destroy in plain language, with the attribute-level diff behind it.",
            meta: "create · update · replace · destroy",
          },
          {
            icon: "bolt",
            title: "Flag destructive changes",
            body: "Call out replacements and deletions prominently, including resources that will be destroyed before they are recreated.",
            meta: "replace · force-new · delete",
          },
          {
            icon: "compass",
            title: "Blast radius",
            body: "Show what depends on a resource so you understand what a change takes down with it.",
            meta: "dependencies · impact",
          },
          {
            icon: "check",
            title: "Review checklist",
            body: "A short, specific checklist for the risky changes — data loss, downtime, cost, and drift — before anyone runs apply.",
            meta: "data loss · downtime · cost",
          },
        ],
        roadmapTitle: "Where plan analysis lands",
        roadmap: [
          { milestone: "M6", title: "Plan parser", body: "Parse a plan file into normalized resource changes, no cloud credentials required." },
          { milestone: "M6", title: "Diff explainer", body: "Translate attribute diffs into impact statements." },
          { milestone: "M6", title: "Destructive-change detection", body: "Rank replacements and deletions by data-loss and downtime risk." },
          { milestone: "M6", title: "Review checklist", body: "Generate a targeted checklist per plan." },
        ],
        ctaTitle: (
          <>
            Review the plan.
            <br />
            Never run apply.
          </>
        ),
        ctaBody:
          "Terraform analysis parses plans; it never runs apply and needs no cloud credentials. Until it ships, Kubernetes diagnosis is live on demo fixtures.",
        primary: { label: "See what's live", href: "/product" },
        secondary: { label: "Read the docs", href: "/docs" },
        ctaNote: "parses plan.json · never executes terraform",
      }}
    />
  );
}
