import Link from "next/link";
import { HealthPill } from "@/components/HealthPill";
import { StatusStrip } from "@/components/StatusStrip";
import { SignatureRing } from "@/components/SignatureRing";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { DiagnosisPreview } from "@/components/DiagnosisPreview";
import { CTASection, Eyebrow } from "@/components/ui";

export default function LandingPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="grid-overlay" />
        <div aria-hidden className="glow glow-amber -left-32 -top-40 h-96 w-96" />
        <div aria-hidden className="glow glow-cool -right-24 top-10 h-80 w-80" />
        <div className="shell relative py-20 pb-24">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            {/* Left: copy */}
            <div className="flex animate-fade-up flex-col justify-center">
              <Eyebrow>Read-only by default</Eyebrow>

              <h1 className="mt-6 font-serif text-display tracking-tight sm:text-display-lg">
                <span className="text-gradient">Investigate infrastructure</span>
                <br />
                <span className="text-paper-300">with evidence, not guesses.</span>
              </h1>

              <p className="mt-6 max-w-prose text-dense-lg text-paper-300">
                Ask why a pod is failing, why a pipeline broke, or what a
                Terraform plan will change. SRE Copilot returns structured
                diagnoses that separate observed facts from hypotheses — with
                citations to the exact evidence used.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/assistant" className="btn-accent">
                  Start an investigation
                  <span aria-hidden>-&gt;</span>
                </Link>
                <Link href="/kubernetes" className="btn-ghost">
                  Try the live demo
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <HealthPill />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                  demo mode · no API key required
                </span>
              </div>
            </div>

            {/* Right: preview */}
            <div className="flex animate-fade-in items-center">
              <DiagnosisPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Watched surfaces ---------- */}
      <StatusStrip />

      {/* ---------- The ring ---------- */}
      <SignatureRing />

      {/* ---------- Tools ---------- */}
      <ToolsGrid />

      {/* ---------- How it works ---------- */}
      <HowItWorks />

      {/* ---------- Pricing ---------- */}
      <Pricing />

      {/* ---------- FAQ ---------- */}
      <FAQ />

      {/* ---------- Final CTA ---------- */}
      <CTASection
        title={
          <>
            Your infrastructure,
            <br />
            quietly watched.
          </>
        }
        body="Run it locally in demo mode with no keys, no cluster, and no cloud account. Point it at a real Kubernetes context, GitHub repository, or Terraform plan when you're ready. Nothing runs against your infrastructure until you approve it."
        primary={{ label: "Open the console", href: "/assistant" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
        note="docker compose up --build · runs on macos, linux, windows"
      />
    </>
  );
}
