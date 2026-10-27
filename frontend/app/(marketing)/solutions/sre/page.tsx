import type { Metadata } from "next";
import { RolePage } from "@/components/RolePage";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/sre" },
  title: "SRE on-call — Tarn",
  description:
    "Get to the evidence before the third tab with ranked hypotheses and cited next steps.",
};

export default function Page() {
  return (
    <RolePage
      config={{
        label: "SRE on-call",
        title: "Get to the evidence before the third tab.",
        lead:
          "At 03:00 you do not need another dashboard. You need the two or three facts that explain the page. Tarn turns a failing state into observed facts, ranked hypotheses, and cited next steps you can review immediately.",
        patternLabel: "On-call sequence",
        patternTitle: "Facts first. Then the smallest useful next check.",
        patternLead:
          "The product can shorten the search. It cannot make the decision for the person holding the pager.",
        steps: [
          {
            mark: "0m",
            title: "Read the failing state",
            body:
              "Pod phase, container state, restart count, exit code, conditions, and warning events are collected before any explanation.",
          },
          {
            mark: "1m",
            title: "Check the citation",
            body:
              "Open the event or previous log line behind a claim. Evidence references stay attached to the diagnosis instead of disappearing into a summary.",
          },
          {
            mark: "2m",
            title: "Review the next step",
            body:
              "Suggested checks are read-only and explicit about what they expect to learn. Nothing is executed on the cluster.",
          },
        ],
        boundariesTitle: "Faster triage is not autonomous remediation.",
        boundaries: [
          "Tarn does not page, acknowledge, escalate, or resolve incidents.",
          "It does not trigger a runbook, re-run a pipeline, or change infrastructure state.",
          "Confidence is a ranking input, not a guarantee that a hypothesis is correct.",
          "If metrics or GitHub data are unavailable, the gap remains in the answer.",
        ],
        primary: { label: "Open the demo", href: "/demo" },
        secondary: { label: "Read the Kubernetes surface", href: "/product/kubernetes" },
      }}
    />
  );
}
