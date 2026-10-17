import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { SignatureRing } from "@/components/SignatureRing";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { DiagnosisPreview } from "@/components/DiagnosisPreview";
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
      {/* ---------- Hero — full-bleed scene ---------- */}
      <section className="hero-scene relative -mt-16 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-4 h-[26rem] w-[26rem] rounded-full bg-[#8d6fde] opacity-40 blur-[110px]" />
          <div className="absolute -right-20 -top-16 h-96 w-96 rounded-full bg-[#6d55bd] opacity-40 blur-[110px]" />
          <div className="absolute bottom-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-[#f0883e] opacity-30 blur-[120px]" />
        </div>

        <div className="shell relative z-10 pt-36 pb-16 text-center sm:pt-40">
          <Link
            href="/kubernetes"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
          >
            <span className="dot dot-good" />
            Read-only by default — diagnose a live demo pod
            <Icon name="arrow" className="size-3.5" />
          </Link>

          <h1 className="mx-auto mt-7 max-w-4xl text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-[3.25rem] lg:text-[4rem]">
            Diagnose infrastructure with{" "}
            <span className="text-gradient-light">evidence, not guesses.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/75">
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
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
              Built to connect with
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {CONNECTS.map((c) => (
                <span
                  key={c}
                  className="text-[15px] font-semibold tracking-tight text-white/70"
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
