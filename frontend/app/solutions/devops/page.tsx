import { SolutionPage } from "@/components/SolutionPage";

export default function DevopsSolutionPage() {
  return (
    <SolutionPage
      config={{
        eyebrow: "Solutions / DevOps",
        title: "Review failures and changes before production",
        subtitle:
          "Pipelines and infrastructure code fail in ways that are hard to read under time pressure. SRE Copilot explains a failing run or a risky plan in plain language, so review happens before the incident, not after.",
        problemsTitle: "Review is where reliability is won or lost",
        problems: [
          { title: "Opaque failures", body: "A red run tells you something broke, not what. Scanning thousands of log lines is slow and error-prone." },
          { title: "Hidden blast radius", body: "A one-line Terraform change can replace a database. The diff does not say that out loud." },
          { title: "Review fatigue", body: "Long diffs get skimmed, and the one destructive line is missed." },
        ],
        helpsTitle: "Explanations a reviewer can follow",
        helps: [
          { icon: "cicd", title: "Pinpoint the failing step", body: "Surface the exact step and log line, correlated with the commit that introduced it.", meta: "step · log line · commit" },
          { icon: "terraform", title: "Explain the plan", body: "Translate a plan into what is created, changed, replaced, or destroyed — with destructive changes called out.", meta: "create · replace · destroy" },
          { icon: "bolt", title: "Blast radius", body: "Show what a change takes down with it, so risk is visible before apply.", meta: "dependencies · impact" },
          { icon: "code", title: "Reviewable generation", body: "Generated manifests and modules arrive as explained diffs, never applied automatically.", meta: "diff · rationale" },
        ],
        outcomes: [
          { value: "Before", label: "Production", hint: "review at the PR, not the page" },
          { value: "1 line", label: "That broke it", hint: "not the whole log" },
          { value: "Flagged", label: "Destructive changes", hint: "extracted from the plan" },
          { value: "0", label: "Auto-applies", hint: "review stays human" },
        ],
        ctaTitle: (
          <>
            Shift the review
            <br />
            left of the incident.
          </>
        ),
        ctaBody: "CI/CD and Terraform surfaces are on the roadmap. Kubernetes diagnosis is live today and shares the same evidence model.",
      }}
    />
  );
}
