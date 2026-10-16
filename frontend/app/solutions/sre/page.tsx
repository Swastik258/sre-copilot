import { SolutionPage } from "@/components/SolutionPage";

export default function SreSolutionPage() {
  return (
    <SolutionPage
      config={{
        eyebrow: "Solutions / SRE on-call",
        title: "Get to the evidence before the third tab",
        subtitle:
          "At 03:00 you do not need another dashboard. You need the two or three facts that explain the page. SRE Copilot turns a failing state into observed facts, ranked hypotheses, and read-only next steps you can run immediately.",
        problemsTitle: "On-call loses time to the same gaps",
        problems: [
          { title: "Context-switching tax", body: "The signal is in one tool, the logs in another, and the recent deploy somewhere else. The clock runs the whole time." },
          { title: "Confident wrongness", body: "A plausible-sounding guess is worse than no answer. Without cited evidence, you cannot tell the difference." },
          { title: "No safe next step", body: "It is unclear which investigation commands are safe to run at 03:00, so people hesitate." },
        ],
        helpsTitle: "A calmer path through triage",
        helps: [
          { icon: "k8s", title: "Facts first", body: "Confirmed observations — restart counts, exit codes, events, conditions — with the pod status behind each one.", meta: "observed facts" },
          { icon: "assistant", title: "Ranked hypotheses", body: "A short list of possible causes with confidence and reasoning, never a single overconfident answer.", meta: "confidence · reasoning" },
          { icon: "arrow", title: "Read-only next steps", body: "Concrete commands to confirm or rule out each hypothesis, each safe because it only reads.", meta: "safe by construction" },
          { icon: "flag", title: "Approval-gated fixes", body: "Remediation is proposed with a rollback and a verification step, and only runs with explicit approval.", meta: "rollback · verify" },
        ],
        outcomes: [
          { value: "Seconds", label: "To first evidence", hint: "not minutes of tab-hopping" },
          { value: "Cited", label: "Every claim", hint: "resource + payload" },
          { value: "Read-only", label: "Next steps", hint: "safe at any hour" },
          { value: "Approved", label: "Any change", hint: "never automatic" },
        ],
        ctaTitle: (
          <>
            Triage with facts,
            <br />
            not adrenaline.
          </>
        ),
        ctaBody: "Open the Kubernetes console and diagnose a crash-looping pod on labelled demo fixtures — no cluster required.",
      }}
    />
  );
}
