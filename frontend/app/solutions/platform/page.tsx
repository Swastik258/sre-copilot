import { SolutionPage } from "@/components/SolutionPage";

export default function PlatformSolutionPage() {
  return (
    <SolutionPage
      config={{
        eyebrow: "Solutions / Platform teams",
        title: "Standardize how incidents get diagnosed",
        subtitle:
          "When every cluster, service, and pipeline speaks a different dialect, diagnosis becomes tribal knowledge. SRE Copilot gives platform teams one read-only, evidence-backed way to explain a failure — across everything they run.",
        problemsTitle: "Diagnosis does not scale with the platform",
        problems: [
          { title: "Tribal knowledge", body: "The people who can read a failing state quickly are the ones who built it. That knowledge does not transfer." },
          { title: "Inconsistent evidence", body: "Two engineers debug the same incident and cite different things, because nothing enforces what 'evidence' means." },
          { title: "Write risk", body: "Most 'helper' tooling quietly holds credentials that can change production. Nobody wants that blast radius." },
        ],
        helpsTitle: "A shared, read-only diagnosis layer",
        helps: [
          { icon: "k8s", title: "One contract across surfaces", body: "Kubernetes today; logs, CI/CD, and Terraform on the roadmap — all producing the same structured, citable evidence.", meta: "consistent evidence model" },
          { icon: "lock", title: "Structurally read-only", body: "The Kubernetes client has no mutating methods, enforced by tests. The safe path is the only path.", meta: "test-enforced" },
          { icon: "audit", title: "Explainable after the fact", body: "Each diagnosis can be traced to the evidence ids and tool calls behind it, so a postmortem can cite the same facts.", meta: "evidence ids · audit" },
          { icon: "settings", title: "Honest status", body: "The console reports what is connected, what is demo, and what is off — never fabricated production numbers.", meta: "connected · demo · off" },
        ],
        outcomes: [
          { value: "1", label: "Evidence model", hint: "for every surface" },
          { value: "0", label: "Write paths by default", hint: "read-only until approved" },
          { value: "100%", label: "Cited claims", hint: "facts vs hypotheses" },
          { value: "Labeled", label: "Demo data", hint: "never disguised as real" },
        ],
        ctaTitle: (
          <>
            One way to diagnose,
            <br />
            across the whole platform.
          </>
        ),
        ctaBody: "Start with the Kubernetes surface that is live, then extend the same contract as the remaining connectors ship.",
      }}
    />
  );
}
