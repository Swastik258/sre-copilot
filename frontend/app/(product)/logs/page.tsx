import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function LogsPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "Logs",
        title: "Find the line that matters in a wall of noise",
        subtitle:
          "Group and deduplicate log streams, surface the first occurrence and the stack trace, and correlate a spike with the change that caused it — without shipping your logs to a third party.",
        status: "planned",
        milestone: "M5",
        previewLabel: "Preview · illustrative log grouping",
        preview: (
          <PreviewPanel
            title="logs · ingestion"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="space-y-1 font-mono text-[11.5px] leading-relaxed">
              <div className="text-tertiary">18:02:09Z INFO  server boot · commit 9f21c4</div>
              <div className="text-bad">
                18:02:11Z ERROR connect redis: ECONNREFUSED redis:6379
              </div>
              <div className="text-tertiary">    at Pool.connect (ioredis/redis.js:190)</div>
              <div className="text-bad">18:02:11Z ERROR process exited code=1</div>
              <div className="pt-2 text-[10.5px] text-tertiary">
                grouped · 47 occurrences · first seen 18:02:11Z · trace 3 frames
              </div>
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What log analysis will do",
        capabilities: [
          {
            icon: "logs",
            title: "Group and deduplicate",
            body: "Collapse thousands of near-identical lines into a small number of signatures, each with a count, a window, and a representative sample.",
            meta: "signature · count · window",
          },
          {
            icon: "route",
            title: "First occurrence & spread",
            body: "Show when a signature first appeared, how fast it spread, and whether it is new or has been running quietly for weeks.",
            meta: "first seen · rate · history",
          },
          {
            icon: "graph",
            title: "Correlate with changes",
            body: "Line up a spike with the deploy, config change, or scaling event that happened just before it.",
            meta: "deploy correlation · commit",
          },
          {
            icon: "shield",
            title: "Redacted by default",
            body: "Tokens, credentials, and private keys are stripped from every line before storage or model use. Uploads are size- and type-validated.",
            meta: "size limits · redaction · scoped",
          },
        ],
        roadmapTitle: "Where log analysis lands",
        roadmap: [
          { milestone: "M5", title: "Grouping & dedupe engine", body: "Signature extraction with counts, windows, and representative samples." },
          { milestone: "M5", title: "Stack-trace parsing", body: "Recognize common runtimes and surface the root frame rather than the top line." },
          { milestone: "M5", title: "Deploy correlation", body: "Tie a signature spike to the change that preceded it." },
          { milestone: "M6", title: "Saved log investigations", body: "Attach a grouped view to an investigation and cite specific signatures as evidence." },
        ],
        ctaTitle: (
          <>
            Bring the logs.
            <br />
            Keep the secrets.
          </>
        ),
        ctaBody:
          "Logs is on the roadmap after the assistant. Until then, the Kubernetes surface already reads container logs (including previous crashes) as part of a diagnosis.",
        primary: { label: "Diagnose a pod", href: "/kubernetes" },
        secondary: { label: "See what's live", href: "/product" },
        ctaNote: "redaction is already implemented in the backend",
      }}
    />
  );
}
