"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PageShell } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { StatusStrip } from "@/components/StatusStrip";
import { Card, Icon, StatusTag, type IconName } from "@/components/ui";
import { useAuth } from "@/lib/auth-client";

type Surface = {
  href: string;
  icon: IconName;
  title: string;
  body: string;
  scope: string;
  status: "live" | "planned" | "partial";
  milestone?: string;
};

const SURFACES: Surface[] = [
  {
    href: "/kubernetes",
    icon: "k8s",
    title: "Kubernetes",
    body: "Read-only diagnosis of unhealthy pods and workloads.",
    scope: "pods · workloads",
    status: "live",
  },
  {
    href: "/logs",
    icon: "logs",
    title: "Logs",
    body: "Group and dedupe, surface the first occurrence.",
    scope: "group · dedupe",
    status: "planned",
    milestone: "M5",
  },
  {
    href: "/cicd",
    icon: "cicd",
    title: "CI/CD",
    body: "Analyze GitHub Actions failures with evidence.",
    scope: "github actions",
    status: "live",
  },
  {
    href: "/terraform",
    icon: "terraform",
    title: "Terraform",
    body: "Explain a plan and flag the risky changes.",
    scope: "plan · risk",
    status: "live",
  },
  {
    href: "/infra-code",
    icon: "code",
    title: "Infrastructure Code",
    body: "Generate and validate infrastructure definitions.",
    scope: "generate · validate",
    status: "planned",
    milestone: "M6",
  },
  {
    href: "/assistant",
    icon: "assistant",
    title: "AI Assistant",
    body: "Investigate an incident with evidence-backed steps.",
    scope: "investigate",
    status: "partial",
    milestone: "M3",
  },
];

const LIVE_SURFACES = SURFACES.filter((surface) => surface.status === "live").length;

function greeting(name: string | null | undefined, email: string | null): string {
  const who = name?.trim() || email?.split("@")[0] || "there";
  return `Welcome back, ${who}`;
}

function initials(name: string | null | undefined, email: string | null): string {
  const source = name?.trim() || email || "SRE Copilot";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SC"
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  // Set while signing out so the guard below does not bounce us to /login.
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && !leavingRef.current) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  async function handleSignOut() {
    leavingRef.current = true;
    await logout();
    router.push("/");
    router.refresh();
  }

  if (loading || !user) {
    return (
      <div className="shell flex min-h-[60vh] items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="relative grid size-12 place-items-center border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-accent">
            <Icon name="graph" className="size-5" />
            <span className="absolute inset-0 animate-pulse border border-[var(--accent)]" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-tertiary">
            {loading ? "Loading your workspace…" : "Redirecting to sign in…"}
          </span>
          <span className="loading-line h-px w-40" />
        </div>
      </div>
    );
  }

  const identity = user.display_name?.trim() || user.email || "Signed-in user";
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <PageShell
      eyebrow="Dashboard"
      title={greeting(user.display_name, user.email)}
      subtitle="Everything here reads from your configured integrations. Nothing is written back to your infrastructure."
      actions={
        <>
          <Link href="/kubernetes" className="btn-accent">
            Start an investigation
            <Icon name="arrow" className="size-4" />
          </Link>
          <button type="button" onClick={handleSignOut} className="btn-ghost">
            Sign out
          </button>
        </>
      }
      aside={
        <div className="badge badge-neutral">
          <span className="status-beacon" />
          Read-only
        </div>
      }
    >
      <StatusStrip />

      <section className="border-b border-hairline">
        <Reveal className="shell py-12 sm:py-14">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
            <Card className="relative overflow-hidden p-7 sm:p-8">
              <div aria-hidden className="grid-overlay" />
              <div aria-hidden className="glow glow-amber -right-24 -top-28 h-64 w-64" />
              <div className="relative">
                <span className="label-caps">Workspace snapshot</span>
                <h2 className="mt-3 max-w-xl font-serif text-[1.8rem] leading-tight tracking-tight text-primary sm:text-[2rem]">
                  A quieter control room for noisy incidents.
                </h2>
                <p className="mt-3 max-w-xl text-dense text-secondary">
                  Pick a surface, collect the evidence, and leave with a diagnosis you
                  can explain. Read-only by construction, with no write path to your
                  infrastructure.
                </p>

                <div className="mt-7 grid grid-cols-3 gap-4">
                  <div className="metric-tile">
                    <div className="metric-value">{LIVE_SURFACES}</div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
                      Live surfaces
                    </div>
                  </div>
                  <div className="metric-tile">
                    <div className="metric-value">{SURFACES.length}</div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
                      Total surfaces
                    </div>
                  </div>
                  <div className="metric-tile">
                    <div className="metric-value">0</div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
                      Write actions
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex items-end justify-between gap-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
                    read-only telemetry
                  </span>
                  <div aria-hidden className="signal-bars w-36">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="label-caps">Recommended next step</span>
                <span className="status-beacon" />
              </div>
              <span className="icon-tile mt-6">
                <Icon name="k8s" />
              </span>
              <h3 className="mt-5 font-serif text-xl text-primary">
                Diagnose an unhealthy pod
              </h3>
              <p className="mt-2 text-dense text-secondary">
                Start with the live Kubernetes surface. Every conclusion cites the
                evidence behind it, and remediation stays a reviewed decision.
              </p>
              <div className="mt-auto flex flex-col gap-2 pt-7">
                <Link href="/kubernetes" className="btn-accent w-full">
                  Open Kubernetes
                  <Icon name="arrow" className="size-4" />
                </Link>
                <Link href="/cicd" className="btn-ghost w-full">
                  Inspect a pipeline
                </Link>
              </div>
            </Card>
          </div>
        </Reveal>
      </section>

      <section className="border-b border-hairline">
        <div className="shell py-16">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label-caps">Diagnosis surfaces</span>
              <h2 className="mt-3 font-serif text-[1.75rem] tracking-tight text-primary">
                Jump into a surface
              </h2>
            </div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
              read-only · evidence-backed
            </span>
          </Reveal>

          <div className="surface-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SURFACES.map((surface) => (
              <Link
                key={surface.href}
                href={surface.href}
                className="group block h-full"
                aria-label={`Open ${surface.title}`}
              >
                <Card hover className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="icon-tile">
                      <Icon name={surface.icon} />
                    </span>
                    <StatusTag
                      status={surface.status}
                      milestone={surface.milestone}
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-primary">{surface.title}</h3>
                    <p className="mt-2 text-dense text-secondary">{surface.body}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-tertiary">
                    <span>{surface.scope}</span>
                    <Icon
                      name="arrow"
                      className="size-4 text-tertiary transition duration-200 group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell grid grid-cols-1 gap-4 py-16 lg:grid-cols-2">
          <Reveal className="h-full">
            <Card className="flex h-full flex-col p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="label-caps">Your account</span>
                <span className="badge badge-good">
                  <span className="dot dot-good" />
                  Signed in
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center border border-accent-soft bg-accent-soft font-mono text-sm font-semibold text-accent">
                  {initials(user.display_name, user.email)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-dense-lg font-medium text-primary">
                    {identity}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-tertiary">
                    {user.email ?? "local account"}
                  </div>
                </div>
              </div>

              <dl className="mt-6 space-y-3 font-mono text-[12px]">
                <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                  <dt className="text-tertiary">Email</dt>
                  <dd className="truncate text-primary">{user.email ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                  <dt className="text-tertiary">Display name</dt>
                  <dd className="text-primary">{user.display_name ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                  <dt className="text-tertiary">Account ID</dt>
                  <dd className="truncate text-secondary">{user.id.slice(0, 8)}…</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-tertiary">Member since</dt>
                  <dd className="text-primary">{memberSince}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-ghost mt-7 self-start"
              >
                Sign out of this device
              </button>
            </Card>
          </Reveal>

          <Reveal delay={90} className="h-full">
            <Card className="flex h-full flex-col p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="label-caps">Investigations</span>
                <StatusTag status="planned" milestone="M3" />
              </div>
              <h3 className="mt-6 font-serif text-xl text-primary">
                Saving runs to your account
              </h3>
              <p className="mt-3 text-dense text-secondary">
                Today a diagnosis runs live and is returned to you; it is not yet
                stored against your account. Investigation history, saved evidence, and
                sharing arrive in Milestone 3.
              </p>
              <ul className="mt-6 space-y-3 text-dense text-secondary">
                <li className="flex items-center gap-3">
                  <span className="dot dot-idle" />
                  Persisted investigation history — planned
                </li>
                <li className="flex items-center gap-3">
                  <span className="dot dot-idle" />
                  Saved evidence views — planned
                </li>
                <li className="flex items-center gap-3">
                  <span className="dot dot-good" />
                  Live, evidence-backed diagnosis — available now
                </li>
              </ul>
              <Link
                href="/kubernetes"
                className="link-arrow mt-auto pt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition hover:text-accent-hover"
              >
                Open Kubernetes diagnosis
                <Icon name="arrow" className="size-3.5" />
              </Link>
            </Card>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
