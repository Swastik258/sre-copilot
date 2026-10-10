import Link from "next/link";
import { DiagnosisPreview } from "@/components/DiagnosisPreview";
import { HealthPill } from "@/components/HealthPill";

const WORKSPACES = [
  {
    code: "01",
    title: "Kubernetes",
    description: "Investigate pod health, events, and cluster signals.",
    href: "/kubernetes",
    mark: "K8",
  },
  {
    code: "02",
    title: "Logs",
    description: "Trace errors, group patterns, and find first occurrence.",
    href: "/logs",
    mark: "⌁",
  },
  {
    code: "03",
    title: "CI/CD",
    description: "Understand failed jobs and the changes behind them.",
    href: "/cicd",
    mark: "↗",
  },
  {
    code: "04",
    title: "Infrastructure",
    description: "Review Terraform plans and infrastructure code.",
    href: "/infra-code",
    mark: "{ }",
  },
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-grid opacity-70" />
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)] lg:gap-16">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-wide text-blue-100/80">
              <span className="size-1.5 rounded-full bg-blue-300" />
              OPERATIONS INTELLIGENCE
            </div>
            <h1 className="max-w-3xl text-[2.7rem] font-semibold leading-[1.06] tracking-[-0.055em] text-white sm:text-6xl xl:text-[4.25rem]">
              Get to the root cause.
              <span className="mt-2 block text-gradient">Not another dashboard.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Investigate infrastructure incidents with evidence from your systems.
              Get clear findings, cited signals, and safe next steps in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/assistant"
                className="shadow-cta inline-flex items-center gap-2 rounded-lg bg-blue-400 px-5 py-3 text-sm font-semibold text-[#07101e] transition hover:bg-blue-300"
              >
                Start an investigation <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="#workspaces"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                Explore workspaces
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-300">✓</span> Read-only by default
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-300">✓</span> Evidence-linked answers
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-300">✓</span> Auditable workflow
              </span>
            </div>
          </div>

          <div className="animate-fade-up relative min-w-0 lg:pl-2">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-blue-500/[0.08] blur-3xl" />
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live system check</span>
              <span className="text-[11px] text-slate-600">Refreshes automatically</span>
            </div>
            <div className="mb-3 rounded-xl border border-white/[0.08] bg-[#0c121d] p-4 shadow-2xl shadow-black/25">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-100">API connectivity</div>
                  <div className="mt-1 text-xs text-slate-500">Backend and database status</div>
                </div>
                <HealthPill />
              </div>
            </div>
            <DiagnosisPreview />
            <p className="mt-3 text-center text-[10px] text-slate-600">
              Illustrative example · sample incident data
            </p>
          </div>
        </section>

        <section id="workspaces" className="mt-24 scroll-mt-24 border-t border-white/[0.08] pt-10 sm:mt-28">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">Your toolkit</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">One place to investigate</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Choose a workspace to explore. Integrations and investigation features are being built incrementally.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {WORKSPACES.map((workspace) => (
              <Link
                key={workspace.code}
                href={workspace.href}
                className="group rounded-xl border border-white/[0.08] bg-[#0c121d]/80 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-[#101a29]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-lg border border-blue-300/15 bg-blue-400/[0.07] font-mono text-xs font-semibold text-blue-200">
                    {workspace.mark}
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">{workspace.code}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold text-slate-100">{workspace.title}</h3>
                <p className="mt-1.5 min-h-10 text-xs leading-5 text-slate-500">{workspace.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-300/80 transition group-hover:text-blue-200">
                  Open workspace <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-[11px] text-slate-600">
          <span>SRE Copilot <span className="text-slate-700">·</span> Operations, with context.</span>
          <span>Demo workspace · no live infrastructure connected</span>
        </footer>
      </div>
    </div>
  );
}
