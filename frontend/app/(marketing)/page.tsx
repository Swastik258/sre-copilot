import type { Metadata } from "next";
import { HomepageSections } from "@/components/HomepageSections";
import { Hero } from "@/components/landing/Hero";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Tarn — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only infrastructure diagnosis across Kubernetes, GitHub Actions, and Prometheus. Structured findings keep observed facts distinct from ranked hypotheses.",
};

export default function Page() {
  return (
    <div className="landing-page">
      <Hero />
      <HomepageSections />
    </div>
  );
}
