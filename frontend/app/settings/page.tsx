import { SurfacePage } from "@/components/SurfacePage";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Badge } from "@/components/ui";

export default function SettingsPage() {
  return (
    <SurfacePage
      config={{
        eyebrow: "Settings",
        title: "Configure integrations without leaking secrets",
        subtitle:
          "Connect Kubernetes, GitHub, Prometheus, and an AI provider; choose what runs locally; and decide exactly what is allowed to leave your machine. Secrets are read on the backend only and never sent to the browser.",
        status: "planned",
        milestone: "M7",
        previewLabel: "Preview · illustrative settings",
        preview: (
          <PreviewPanel
            title="settings · integrations"
            badge={<Badge tone="neutral">illustrative</Badge>}
          >
            <div className="divide-y divide-hairline font-mono text-[11.5px]">
              {[
                { name: "Kubernetes", state: "demo", tone: "dot-warn", detail: "fixtures · read-only" },
                { name: "GitHub", state: "off", tone: "dot-idle", detail: "no token configured" },
                { name: "Prometheus", state: "off", tone: "dot-idle", detail: "no URL configured" },
                { name: "AI provider", state: "mock", tone: "dot-good", detail: "no key required" },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-paper-200">
                    <span className={`dot ${r.tone}`} />
                    {r.name}
                  </span>
                  <span className="text-paper-400">{r.detail}</span>
                </div>
              ))}
            </div>
          </PreviewPanel>
        ),
        capabilitiesTitle: "What settings will cover",
        capabilities: [
          {
            icon: "settings",
            title: "Integration status",
            body: "See at a glance what is connected, what is in demo mode, and what is switched off — the same honest status the API already reports.",
            meta: "connected · demo · off",
          },
          {
            icon: "assistant",
            title: "AI provider & model",
            body: "Pick the mock provider for offline work or a hosted provider when you supply a key. Provider selection is a single, explicit choice.",
            meta: "mock · openai · anthropic",
          },
          {
            icon: "shield",
            title: "Privacy mode",
            body: "Turn on privacy mode to guarantee that no investigation content is ever sent to an external provider. Enforced at call time.",
            meta: "AI_PRIVACY_MODE",
          },
          {
            icon: "lock",
            title: "Secret handling",
            body: "Keys are read on the backend only. They are never embedded in the frontend bundle, logged, or returned by the API.",
            meta: "backend-only · never in the bundle",
          },
        ],
        roadmapTitle: "Where settings lands",
        roadmap: [
          { milestone: "M7", title: "Integration editor", body: "Configure and test each connector from the console." },
          { milestone: "M7", title: "Provider selection", body: "Choose the AI provider and model, with privacy mode front and center." },
          { milestone: "M7", title: "Workspace & seats", body: "Team workspace, seats, and SSO configuration." },
          { milestone: "M7", title: "Audit preferences", body: "Retention and export settings for the audit trail." },
        ],
        ctaTitle: (
          <>
            Your keys stay
            <br />
            on your side.
          </>
        ),
        ctaBody:
          "Until the settings UI ships, everything is configured with environment variables — documented and validated on startup. Demo mode needs none of them.",
        primary: { label: "Read local setup", href: "/docs" },
        secondary: { label: "See the roadmap", href: "/changelog" },
        ctaNote: "configured via env vars today",
      }}
    />
  );
}
