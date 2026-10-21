import { SurfacePage } from "@/components/SurfacePage";
import { PreviewLabel, PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function AssistantPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "AI Assistant",
        title: "Ask why. Get evidence, not a paragraph of confidence.",
        subtitle:
          "A conversational surface for investigating reliability problems. The model can request a fixed set of read-only operations, and every answer separates what was observed from what is only suspected.",
        status: "planned",
        milestone: "M3",
        previewLabel: "Preview · illustrative conversation",
        preview: (
          <PreviewPanel
            title="assistant · investigation session"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="space-y-4 text-[12.5px]">
              <div>
                <PreviewLabel>you</PreviewLabel>
                <p className="mt-1 text-paper-100">
                  Why did the checkout deployment start failing after the 18:02 deploy?
                </p>
              </div>
              <div className="border-t border-hairline pt-3">
                <PreviewLabel>observed</PreviewLabel>
                <ul className="mt-1.5 space-y-1 font-mono text-[11.5px] text-paper-200">
                  <li>· deploy checkout@v412 rolled out 18:02:11Z</li>
                  <li>· 3/3 pods CrashLoopBackOff within 90s</li>
                  <li>· previous logs end at <span className="text-signal-bad">connect ECONNREFUSED redis:6379</span></li>
                </ul>
              </div>
              <div className="border-t border-hairline pt-3">
                <PreviewLabel>hypothesis · 0.72</PreviewLabel>
                <p className="mt-1 text-paper-200">
                  The release likely points at a Redis service the new pod cannot reach
                  (wrong namespace or missing Service). The DB dependency is healthy.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-hairline pt-3">
                {["ev_9f21", "ev_b7c0", "ev_44ae"].map((id) => (
                  <span
                    key={id}
                    className="rounded border border-hairline-strong px-1.5 py-0.5 font-mono text-[10px] text-paper-400"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "How the assistant stays honest",
        capabilities: [
          {
            icon: "assistant",
            title: "Plain-language questions",
            body: "Ask about a pod, a pipeline, a plan, or a log spike in your own words. The assistant decides which read-only evidence to gather next.",
            meta: "no shell · no code execution",
          },
          {
            icon: "lock",
            title: "Allowlisted read tools only",
            body: "The model may only call a fixed, schema-validated set of read operations. A separate policy layer checks every request before a tool runs.",
            meta: "k8s.get · k8s.list · logs.read · gh.workflow.runs",
          },
          {
            icon: "layers",
            title: "One interface, any provider",
            body: "A mock provider for offline development plus hosted providers behind a single interface. Structured output is validated before it is trusted.",
            meta: "mock · openai · anthropic",
          },
          {
            icon: "shield",
            title: "Privacy mode",
            body: "With privacy mode on, investigation content never leaves your machine — external providers are rejected at call time, not merely discouraged.",
            meta: "AI_PRIVACY_MODE=true",
          },
        ],
        roadmapTitle: "Where the assistant lands",
        roadmapLead:
          "The assistant is built on the same evidence model already live for Kubernetes. M3 wires it into a persisted investigation you can return to and cite later.",
        roadmap: [
          { milestone: "M1", title: "Foundation & evidence contract", body: "Validated config, structured logging, redaction, and the shared Evidence schema.", done: true },
          { milestone: "M2", title: "Read-only Kubernetes diagnosis", body: "Deterministic rules producing evidence-backed diagnoses, live today.", done: true },
          { milestone: "M3", title: "Assistant & investigation engine", body: "Investigation persistence, a messages API, and mock/OpenAI/Anthropic behind one schema-validated interface." },
          { milestone: "M4", title: "Saved, citable investigations", body: "Resume an investigation, export it, and reference its evidence ids from other surfaces." },
        ],
        ctaTitle: (
          <>
            Evidence-first,
            <br />
            from the first question.
          </>
        ),
        ctaBody:
          "Start with the Kubernetes surface that is already live, then follow the assistant as it ships. Demo mode runs with no key and no cluster.",
        primary: { label: "Try Kubernetes now", href: "/kubernetes" },
        secondary: { label: "See the roadmap", href: "/changelog" },
        ctaNote: "mock provider by default · no key required",
      }}
    />
  );
}
