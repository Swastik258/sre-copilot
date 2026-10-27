import type { Metadata } from "next";
import { RolePage } from "@/components/RolePage";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/platform" },
  title: "Platform teams — Tarn",
  description:
    "Standardize evidence-backed diagnosis across the platform with a read-only contract.",
};

export default function Page() {
  return (
    <RolePage
      config={{
        label: "Platform teams",
        title: "Standardize how incidents get diagnosed.",
        lead:
          "When every cluster, service, and pipeline speaks a different dialect, diagnosis becomes tribal knowledge. Tarn gives platform teams one read-only, evidence-backed account of a failure across the systems they operate.",
        patternLabel: "Operating pattern",
        patternTitle: "Make the evidence reusable, not the dashboard.",
        patternLead:
          "A platform standard is only useful if an on-call engineer can inspect it. The contract below is the part Tarn can enforce.",
        steps: [
          {
            mark: "0m",
            title: "Normalize the read",
            body:
              "Kubernetes, logs, CI/CD, Terraform, and Prometheus adapters expose observations in one shape. The source remains visible.",
          },
          {
            mark: "1m",
            title: "Keep the payload",
            body:
              "Each observation carries an evidence reference back to the status, event, log line, run, or plan change that produced it.",
          },
          {
            mark: "2m",
            title: "Rank, then stop",
            body:
              "Hypotheses are ordered with confidence and citations. The output is a review artifact, not an execution plan.",
          },
        ],
        boundariesTitle: "A shared standard is not a shared control plane.",
        boundaries: [
          "Tarn does not replace your incident process, change approval, or observability stack.",
          "The Kubernetes client is structurally read-only; there is no exec, delete, patch, or apply method.",
          "Generated infrastructure code is a proposal. It is not written to a repository or applied by Tarn.",
          "A missing integration is reported as missing evidence, not filled in with a guess.",
        ],
        primary: { label: "Open the demo", href: "/demo" },
        secondary: { label: "See the product", href: "/product" },
      }}
    />
  );
}
