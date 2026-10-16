import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function CicdPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "CI/CD",
        title: "Why the pipeline broke — and whether it's your change",
        subtitle:
          "Explain a failed GitHub Actions run: the step that failed, the log line that caused it, the commit it belongs to, and whether the failure is new or a chronic flake.",
        status: "planned",
        milestone: "M5",
        previewLabel: "Preview · illustrative workflow run",
        preview: (
          <PreviewPanel
            title="cicd · workflow run #4127"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="divide-y divide-hairline font-mono text-[11.5px]">
              <div className="flex items-center justify-between py-2">
                <span className="text-paper-200">build</span>
                <span className="dot dot-good" />
                <span className="text-paper-300">passed · 42s</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-paper-200">test</span>
                <span className="dot dot-good" />
                <span className="text-paper-300">passed · 1m 12s</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-paper-200">docs</span>
                <span className="dot dot-bad" />
                <span className="text-signal-bad">failed · 8s</span>
              </div>
              <div className="py-3 text-paper-400">
                <span className="text-signal-bad">error</span>{" "}
                link to #install has no matching heading
              </div>
              <div className="py-2 text-[10.5px] text-paper-400">
                step failed after commit 9f21c4 · first failure on this branch
              </div>
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What CI/CD diagnosis will do",
        capabilities: [
          {
            icon: "cicd",
            title: "Pinpoint the failing step",
            body: "Read the workflow run and surface the exact step and log line that failed, with the surrounding context.",
            meta: "workflow · job · step · log line",
          },
          {
            icon: "route",
            title: "Correlate with the commit",
            body: "Map the failure to the commit and files that changed, so you know whether the breakage is yours to own.",
            meta: "commit · changed files",
          },
          {
            icon: "graph",
            title: "New vs. chronic",
            body: "Distinguish a genuine regression from a flaky test that has failed intermittently for a week.",
            meta: "history · flake score",
          },
          {
            icon: "lock",
            title: "Read-only on your repo",
            body: "The connector reads workflow runs and logs. It cannot trigger, cancel, rerun, or push — it only explains.",
            meta: "no trigger · no cancel · no push",
          },
        ],
        roadmapTitle: "Where CI/CD lands",
        roadmap: [
          { milestone: "M5", title: "GitHub Actions reader", body: "List and read workflow runs, jobs, and step logs with a token scoped to one repo." },
          { milestone: "M5", title: "Failure classification", body: "Recognize common failure classes and separate them from flakes." },
          { milestone: "M5", title: "Commit correlation", body: "Attribute a failure to the commit that introduced it." },
          { milestone: "M6", title: "Investigation handoff", body: "Attach a pipeline failure to an investigation alongside the cluster evidence." },
        ],
        ctaTitle: (
          <>
            Read the failure,
            <br />
            not the whole log.
          </>
        ),
        ctaBody:
          "CI/CD is scheduled after the assistant. Until it ships, Kubernetes diagnosis is live and runs entirely on labelled demo fixtures.",
        primary: { label: "Diagnose a pod", href: "/kubernetes" },
        secondary: { label: "Read the docs", href: "/docs" },
        ctaNote: "GitHub token is read-only and repo-scoped",
      }}
    />
  );
}
