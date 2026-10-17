import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { SignatureRing } from "@/components/SignatureRing";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { DiagnosisPreview } from "@/components/DiagnosisPreview";
import { Reveal } from "@/components/Reveal";
import { Icon, CTASection } from "@/components/ui";

const CONNECTS = [
  "Kubernetes",
  "GitHub Actions",
  "Terraform",
  "Prometheus",
  "OpenTelemetry",
];

export default function LandingPage() {
  return (
    <>
      {/* ---------- Hero — dark, faint grid, one violet glow ---------- */}
      <section className="relative -mt-24 overflow-hidden border-b border-hairline">
        <div aria-hidden className="grid-overlay" />
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[48rem]"
        />

        <div className="shell relative z-10 pb-16 pt-36 text-center sm:pt-40">
          <Link href="/kubernetes" className="badge-border inline-flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0b0b0d]/90 px-4 py-1.5 text-[13px] font-medium text-white/90">
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70"
                  style={{ animation: "dot-ping 1.9s cubic-bezier(0,0,0.2,1) infinite" }}
                />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Read-only by default — diagnose a live demo pod
              <Icon name="arrow" className="size-3.5" />
            </span>
          </Link>

          <h1 className="text-gradient-light mx-auto mt-7 max-w-4xl text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-[3.25rem] lg:text-[4rem]">
            Diagnose infrastructure with evidence, not guesses.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-paper-300">
            Ask why a pod is failing, why a pipeline broke, or what a Terraform
            plan will change. SRE Copilot returns structured diagnoses that
            separate observed facts from hypotheses — with citations to the
            exact evidence used.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/assistant" className="btn-light">
              Start an investigation
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/kubernetes" className="btn-glass">
              Try the live demo
            </Link>
          </div>

          <div className="mt-16">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-paper-400">
              Built to connect with
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {CONNECTS.map((c) => (
                <span
                  key={c}
                  className="text-[15px] font-semibold tracking-tight text-paper-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Product mockup floating over the scene */}
        <div className="shell relative z-10 pb-28">
          <div className="mx-auto max-w-4xl">
            <DiagnosisPreview />
          </div>
        </div>
      </section>

      {/* ---------- Watched surfaces ---------- */}
      <Reveal>
        <StatusStrip />
      </Reveal>

      {/* ---------- The ring ---------- */}
      <Reveal>
        <SignatureRing />
      </Reveal>

      {/* ---------- Tools ---------- */}
      <Reveal>
        <ToolsGrid />
      </Reveal>

      {/* ---------- How it works ---------- */}
      <Reveal>
        <HowItWorks />
      </Reveal>

      {/* ---------- Pricing ---------- */}
      <Reveal>
        <Pricing />
      </Reveal>

      {/* ---------- FAQ ---------- */}
      <Reveal>
        <FAQ />
      </Reveal>

      {/* ---------- Final CTA ---------- */}
      <Reveal>
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
      </Reveal>
    </>
  );
}
