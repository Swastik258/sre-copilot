import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function AuditPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "Audit",
        title: "Every action, quietly recorded",
        subtitle:
          "A durable trail of what was asked, what the policy layer decided, and what actually ran — with redacted outcomes and an export you can hand to a reviewer.",
        status: "planned",
        milestone: "M7",
        previewLabel: "Preview · illustrative audit trail",
        preview: (
          <PreviewPanel
            title="audit · recent events"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="divide-y divide-hairline font-mono text-[11.5px]">
              {[
                { t: "18:41:02", actor: "you", action: "k8s.pods.list", decision: "allow" },
                { t: "18:41:05", actor: "you", action: "k8s.events.get", decision: "allow" },
                { t: "18:41:08", actor: "you", action: "k8s.logs.previous", decision: "allow" },
                { t: "18:41:11", actor: "ai", action: "tool:redact", decision: "allow" },
                { t: "18:41:11", actor: "ai", action: "tool:propose", decision: "deny" },
              ].map((r) => (
                <div
                  key={r.t + r.action}
                  className="grid grid-cols-[3.5rem_2.5rem_1fr_3.5rem] gap-3 py-2"
                >
                  <span className="text-paper-400">{r.t}</span>
                  <span className="text-paper-400">{r.actor}</span>
                  <span className="truncate text-paper-200">{r.action}</span>
                  <span className={r.decision === "allow" ? "text-signal-good" : "text-signal-bad"}>
                    {r.decision}
                  </span>
                </div>
              ))}
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What the audit trail will capture",
        capabilities: [
          {
            icon: "audit",
            title: "Actor, resource, decision",
            body: "Who asked, against which resource, and whether the policy layer allowed or denied it — in a stable, queryable form.",
            meta: "actor · resource · decision",
          },
          {
            icon: "shield",
            title: "Redacted outcomes",
            body: "The audit log stores sanitized results. Secrets never reach it, even when they appeared in the underlying payload.",
            meta: "sanitized · no secrets",
          },
          {
            icon: "eye",
            title: "Explainability",
            body: "Every diagnosis can be traced back to the exact evidence and tool calls that produced it, days later.",
            meta: "evidence ids · tool calls",
          },
          {
            icon: "book",
            title: "Export & retention",
            body: "Export the trail for a review and configure retention to match your policy.",
            meta: "export · retention",
          },
        ],
        roadmapTitle: "Where audit lands",
        roadmap: [
          { milestone: "M1", title: "Audit service & model", body: "The AuditEvent model and service already exist and are exercised by tests.", done: true },
          { milestone: "M7", title: "Full policy trail", body: "Record every tool call and approval decision, not only diagnoses." },
          { milestone: "M7", title: "Audit UI", body: "Browse, filter, and search the trail in the console." },
          { milestone: "M7", title: "Export & retention", body: "Export for review and enforce a retention policy." },
        ],
        ctaTitle: (
          <>
            Accountable
            <br />
            by design.
          </>
        ),
        ctaBody:
          "The audit model ships in the foundation; the browsable trail arrives with governance features. Until then, reads and diagnoses are already recorded in the database.",
        primary: { label: "See what's live", href: "/product" },
        secondary: { label: "Read the docs", href: "/docs" },
        ctaNote: "audit events are written today",
      }}
    />
  );
}
