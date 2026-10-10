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

const TEAMS = [
  {
    number: "01",
    title: "Platform engineering",
    description: "Give service teams a consistent path through infrastructure incidents.",
    href: "/solutions/platform",
  },
  {
    number: "02",
    title: "SRE and on-call",
    description: "Bring the relevant signals and next investigative steps together.",
    href: "/solutions/sre",
  },
  {
    number: "03",
    title: "DevOps",
    description: "Trace delivery failures across builds, deployments, and infrastructure.",
    href: "/solutions/devops",
  },
  {
    number: "04",
    title: "Infrastructure teams",
    description: "Review infrastructure changes alongside operational context.",
    href: "/infra-code",
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
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">One place to investigate</h2>
            </div>
            <p className="max-w-md text-base leading-7 text-slate-400">
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
                  <span className="font-mono text-xs text-slate-500">{workspace.code}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-100">{workspace.title}</h3>
                <p className="mt-1.5 min-h-12 text-sm leading-6 text-slate-400">{workspace.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-300/80 transition group-hover:text-blue-200">
                  Open workspace <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-white/[0.08] pt-10">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">Who it is for</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Teams on the response path</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-400">
              SRE Copilot is being shaped around the teams responsible for keeping services reliable. These are audience areas, not customer endorsements.
            </p>
          </div>
          <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {TEAMS.map((team) => (
              <Link
                key={team.number}
                href={team.href}
                className="group flex gap-4 border-b border-white/[0.08] py-5 transition-colors hover:border-blue-300/30"
              >
                <span className="pt-1 font-mono text-xs text-blue-300/70">{team.number}</span>
                <span>
                  <span className="block text-base font-semibold text-slate-100">{team.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">{team.description}</span>
                </span>
                <span className="ml-auto pt-1 text-blue-300 opacity-0 transition group-hover:opacity-100" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-white/[0.08] pt-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">Current build</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">A useful starting point</h2>
            </div>
            <Link href="/docs" className="text-sm font-medium text-blue-300 transition hover:text-blue-200">
              Read the docs <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-8 border-y border-white/[0.08] py-7 md:grid-cols-3 md:gap-10">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Live API status</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">The home page checks backend and database health every 15 seconds.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Evidence preview</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">The diagnosis panel is an illustrative sample, not a live incident analysis.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Clerk authentication</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Sign-in and sign-up use Clerk modals; workspace routes are not yet protected.</p>
            </div>
          </div>
        </section>

      </div>
      <footer className="mt-16 bg-[#050608] text-paper-200">
        <div className="mx-auto max-w-[1064px] px-6 pt-14">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold text-paper-50">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-signal-good border-t-transparent" />
                </span>
                SRE Copilot
              </Link>
              <p className="mt-8 text-sm text-paper-300">Follow the work</p>
              <Link href="/support" className="mt-3 inline-block text-sm text-paper-400 transition hover:text-paper-100">
                Get in touch
              </Link>
            </div>

            <div>
              <h2 className="text-sm font-medium text-paper-50">Product</h2>
              <ul className="mt-6 space-y-2 text-sm text-paper-300">
                <li><Link className="transition hover:text-paper-50" href="/assistant">AI Assistant</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/kubernetes">Kubernetes</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/logs">Logs</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-medium text-paper-50">Workspaces</h2>
              <ul className="mt-6 space-y-2 text-sm text-paper-300">
                <li><Link className="transition hover:text-paper-50" href="/cicd">CI/CD</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/terraform">Terraform</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/infra-code">Infrastructure code</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/audit">Audit</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-medium text-paper-50">Resources</h2>
              <ul className="mt-6 space-y-2 text-sm text-paper-300">
                <li><Link className="transition hover:text-paper-50" href="/docs">Docs</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/blog">Blog</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/changelog">Changelog</Link></li>
                <li><Link className="transition hover:text-paper-50" href="/support">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-24 overflow-hidden" aria-hidden="true">
            <div className="whitespace-nowrap text-[3.25rem] leading-[0.9] text-transparent [-webkit-text-stroke:1.5px_#1769d2] sm:text-[6rem] md:text-[8rem]">
              SRE COPILOT
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-white/[0.08] py-5 text-[11px] text-paper-400">
            <span>© 2026 SRE Copilot</span>
            <span>Read-only by default · Evidence-linked answers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
