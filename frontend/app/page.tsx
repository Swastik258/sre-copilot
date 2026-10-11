import { HealthPill } from "@/components/HealthPill";
import { StatusStrip } from "@/components/StatusStrip";
import { SignatureRing } from "@/components/SignatureRing";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";

export default function LandingPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-hairline bg-ink-900">
        <div className="mx-auto max-w-wide px-6 pt-20 pb-24">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            {/* Left: copy */}
            <div className="flex flex-col justify-center">
              <span className="label-caps">Read-only by default</span>

              <h1 className="mt-5 font-serif text-display tracking-tight text-paper-50 sm:text-display-lg">
                Investigate infrastructure
                <br />
                <span className="text-paper-200">with evidence, not guesses.</span>
              </h1>

              <p className="mt-6 max-w-prose text-dense-lg text-paper-300">
                Ask why a pod is failing, why a pipeline broke, or what a
                Terraform plan will change. SRE Copilot returns structured
                diagnoses that separate observed facts from hypotheses — with
                citations to the exact evidence used.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="/assistant" className="btn-accent">
                  Start an investigation
                  <span aria-hidden>-&gt;</span>
                </a>
                <a href="/docs" className="btn-ghost">
                  Read the docs
                </a>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <HealthPill />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                  demo mode · no API key required
                </span>
              </div>
            </div>

            {/* Right: preview */}
            <div className="flex items-center">
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
      <section className="border-t border-hairline bg-ink-950/40">
        <div className="mx-auto max-w-wide px-6 py-24">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div>
              <span className="label-caps">Get started</span>
              <h2 className="mt-4 font-serif text-display tracking-tight text-paper-50">
                Your infrastructure,
                <br />
                quietly watched.
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <p className="max-w-prose text-dense-lg text-paper-300">
                Run it locally in demo mode with no keys, no cluster, and no
                cloud account. Point it at a real Kubernetes context, GitHub
                repository, or Terraform plan when you're ready. Nothing
                runs against your infrastructure until you approve it.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="/assistant" className="btn-accent">
                  Open the console
                  <span aria-hidden>-&gt;</span>
                </a>
                <a href="/pricing" className="btn-ghost">
                  See pricing
                </a>
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                docker compose up --build · runs on macos, linux, windows
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-hairline bg-ink-900">
        <div className="mx-auto max-w-wide px-6 py-14">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <FooterCol
              title="Product"
              links={[
                { label: "AI Assistant", href: "/assistant" },
                { label: "Kubernetes", href: "/kubernetes" },
                { label: "Logs", href: "/logs" },
                { label: "CI/CD", href: "/cicd" },
                { label: "Terraform", href: "/terraform" },
              ]}
            />
            <FooterCol
              title="Solutions"
              links={[
                { label: "Platform teams", href: "/solutions/platform" },
                { label: "SRE on-call", href: "/solutions/sre" },
                { label: "DevOps", href: "/solutions/devops" },
                { label: "Customers", href: "/customers" },
              ]}
            />
            <FooterCol
              title="Resources"
              links={[
                { label: "Docs", href: "/docs" },
                { label: "Blog", href: "/blog" },
                { label: "Changelog", href: "/changelog" },
                { label: "Support", href: "/support" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "Pricing", href: "/pricing" },
                { label: "Security", href: "/security" },
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
              <span className="grid size-5 place-items-center rounded border border-hairline-strong bg-ink-800 text-[9px] font-semibold text-amber-500">
                SC
              </span>
              <span>SRE Copilot · Milestone 1</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
              <span className="dot dot-good" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ---------- Small helpers ---------- */

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="label-caps">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="text-dense text-paper-300 transition hover:text-paper-100"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Imported at the bottom to avoid hoisting confusion ---------- */
import { DiagnosisPreview } from "@/components/DiagnosisPreview";