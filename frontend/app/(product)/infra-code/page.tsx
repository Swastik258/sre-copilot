import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function InfraCodePage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "Infrastructure Code",
        title: "Generate infrastructure code you can review",
        subtitle:
          "Produce Kubernetes manifests and Terraform modules, validate them against policy, and present every change as a diff with a reason — always reviewable, never applied automatically.",
        status: "planned",
        milestone: "M6",
        previewLabel: "Preview · illustrative generated manifest",
        preview: (
          <PreviewPanel
            title="infra-code · proposed diff"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="space-y-1 font-mono text-[11.5px] leading-relaxed">
              <div className="text-tertiary">deployments/checkout.yaml</div>
              <div className="text-good">+ resources:</div>
              <div className="text-good">+   requests: {"{"} cpu: 100m, memory: 128Mi {"}"}</div>
              <div className="text-good">+   limits:   {"{"} memory: 256Mi {"}"}</div>
              <div className="text-good">+ readinessProbe:</div>
              <div className="text-good">+   httpGet: {"{"} path: /healthz, port: 8080 {"}"}</div>
              <div className="pt-2 text-warn">
                policy: container has no livenessProbe — recommended
              </div>
              <div className="text-[10.5px] text-tertiary">
                generated diff · 2 policy notes · not applied
              </div>
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What code assistance will do",
        capabilities: [
          {
            icon: "code",
            title: "Generate from intent",
            body: "Describe what you want and get a manifest or module that follows your conventions and naming.",
            meta: "manifests · modules",
          },
          {
            icon: "shield",
            title: "Validate against policy",
            body: "Check generated code for missing limits, probes, pinned images, and other rules before it reaches a cluster.",
            meta: "limits · probes · image pins",
          },
          {
            icon: "eye",
            title: "Show diffs, with reasons",
            body: "Every proposed change is a diff you can read, each line explained. Nothing is written to a cluster or repo automatically.",
            meta: "diff · rationale",
          },
          {
            icon: "flag",
            title: "Approval before apply",
            body: "Generated code stops at a reviewable proposal. Applying it is a separate, human-approved step.",
            meta: "proposal · approval gated",
          },
        ],
        roadmapTitle: "Where code assistance lands",
        roadmap: [
          { milestone: "M6", title: "Manifest generation", body: "Generate Kubernetes manifests from a described intent." },
          { milestone: "M6", title: "Policy validation", body: "A rule set for the common reliability and security footguns." },
          { milestone: "M6", title: "Diff-first review", body: "Present every change as an explained diff." },
          { milestone: "M7", title: "Audit integration", body: "Record generated and approved changes in the audit trail." },
        ],
        ctaTitle: (
          <>
            Generated code
            <br />
            still gets reviewed.
          </>
        ),
        ctaBody:
          "Infrastructure code generation is a later milestone. It will always stop at a human-approved diff — the same read-only guarantee the rest of the product keeps.",
        primary: { label: "See what's live", href: "/product" },
        secondary: { label: "Read the docs", href: "/docs" },
        ctaNote: "never applied automatically",
      }}
    />
  );
}
