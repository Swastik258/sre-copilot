import type { Metadata } from "next";
import { RolePage } from "@/components/RolePage";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/devops" },
  title: "DevOps — Tarn",
  description:
    "Review failing pipelines and risky infrastructure plans before production.",
};

export default function Page() {
  return (
    <RolePage
      config={{
        label: "DevOps",
        title: "Review failures and changes before production.",
        lead:
          "Pipelines and infrastructure code fail in ways that are hard to read under time pressure. Tarn explains a failing run or a risky plan in plain language, so review happens before the incident, not after.",
        patternLabel: "Pre-production review",
        patternTitle: "Read the failure. Read the plan. Keep apply out of the tool.",
        patternLead:
          "Tarn is useful before the change lands, not only after the page. Both surfaces stay read-only.",
        steps: [
          {
            mark: "0m",
            title: "Locate the failing step",
            body:
              "For a GitHub Actions run, Tarn narrows the review to the failed job and step, with the triggering branch and commit in context.",
          },
          {
            mark: "1m",
            title: "Read the change as a change",
            body:
              "For Terraform, creates, updates, replacements, and deletions are summarized separately so a replacement is not mistaken for a routine update.",
          },
          {
            mark: "2m",
            title: "Leave execution where it belongs",
            body:
              "Tarn does not re-run workflows or run Terraform. The pipeline and the apply path remain under your existing controls.",
          },
        ],
        boundariesTitle: "Review is not approval, and a summary is not apply.",
        boundaries: [
          "Tarn does not trigger, re-run, cancel, or approve a workflow.",
          "Tarn does not run terraform plan or terraform apply.",
          "Generated infrastructure code is proposal-only and is never written to a repository.",
          "A plan summary cannot replace the plan itself, policy checks, or human review.",
        ],
        primary: { label: "Open the demo", href: "/demo" },
        secondary: { label: "Compare the surfaces", href: "/product" },
      }}
    />
  );
}
