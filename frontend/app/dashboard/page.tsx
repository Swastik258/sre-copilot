"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PageShell } from "@/components/PageShell";
import { StatusStrip } from "@/components/StatusStrip";
import { Card, Icon, StatusTag, type IconName } from "@/components/ui";
import { useAuth } from "@/lib/auth-client";

const SURFACES: {
  href: string;
  icon: IconName;
  title: string;
  body: string;
  scope: string;
}[] = [
  {
    href: "/kubernetes",
    icon: "k8s",
    title: "Kubernetes",
    body: "Read-only diagnosis of unhealthy pods and workloads.",
    scope: "pods · workloads",
  },
  {
    href: "/logs",
    icon: "logs",
    title: "Logs",
    body: "Group and dedupe, surface the first occurrence.",
    scope: "group · dedupe",
  },
  {
    href: "/cicd",
    icon: "cicd",
    title: "CI/CD",
    body: "Analyze GitHub Actions failures with evidence.",
    scope: "github actions",
  },
  {
    href: "/terraform",
    icon: "terraform",
    title: "Terraform",
    body: "Explain a plan and flag the risky changes.",
    scope: "plan · risk",
  },
  {
    href: "/infra-code",
    icon: "code",
    title: "Infrastructure Code",
    body: "Generate and validate infrastructure definitions.",
    scope: "generate · validate",
  },
  {
    href: "/assistant",
    icon: "assistant",
    title: "AI Assistant",
    body: "Investigate an incident with evidence-backed steps.",
    scope: "investigate",
  },
];

function greeting(name: string | null | undefined, email: string | null): string {
  const who = name?.trim() || email?.split("@")[0] || "there";
  return `Welcome back, ${who}`;
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
      <div className="shell flex min-h-[50vh] items-center justify-center py-24">
        <div className="flex items-center gap-3 text-paper-300">
          <span className="dot dot-warn animate-pulse" />
          <span className="font-mono text-[12px] uppercase tracking-[0.14em]">
            {loading ? "Loading your workspace…" : "Redirecting to sign in…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Dashboard"
      title={greeting(user.display_name, user.email)}
      subtitle="Everything here reads from your configured integrations. Nothing is written back to your infrastructure."
      actions={
        <>
          <Link href="/assistant" className="btn-accent">
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
          <span className="dot dot-warn" />
          Read-only
        </div>
      }
    >
      <StatusStrip />

      {/* Quick access */}
      <section className="border-b border-hairline">
        <div className="shell py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label-caps">Diagnosis surfaces</span>
              <h2 className="mt-3 font-serif text-[1.75rem] tracking-tight text-paper-50">
                Jump into a surface
              </h2>
            </div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
              read-only · evidence-backed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SURFACES.map((surface) => (
              <Link key={surface.href} href={surface.href} className="group block">
                <Card hover className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                      <Icon name={surface.icon} />
                    </span>
                    <Icon
                      name="arrow"
                      className="size-4 text-paper-400 transition group-hover:text-paper-100"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-paper-50">{surface.title}</h3>
                    <p className="mt-2 text-dense text-paper-300">{surface.body}</p>
                  </div>
                  <div className="mt-auto border-t border-hairline pt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper-400">
                    {surface.scope}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Account + persistence */}
      <section className="border-b border-hairline">
        <div className="shell grid grid-cols-1 gap-4 py-16 lg:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="label-caps">Your account</span>
              <span className="badge badge-good">
                <span className="dot dot-good" />
                Signed in
              </span>
            </div>
            <dl className="mt-6 space-y-3 font-mono text-[12px]">
              <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                <dt className="text-paper-400">Email</dt>
                <dd className="truncate text-paper-100">{user.email ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                <dt className="text-paper-400">Display name</dt>
                <dd className="text-paper-100">{user.display_name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                <dt className="text-paper-400">Account ID</dt>
                <dd className="truncate text-paper-300">{user.id.slice(0, 8)}…</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-paper-400">Created</dt>
                <dd className="text-paper-100">
                  {new Date(user.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
            <button type="button" onClick={handleSignOut} className="btn-ghost mt-7">
              Sign out of this device
            </button>
          </Card>

          <Card className="flex flex-col p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="label-caps">Investigations</span>
              <StatusTag status="planned" milestone="M3" />
            </div>
            <h3 className="mt-6 font-serif text-xl text-paper-50">
              Saving runs to your account
            </h3>
            <p className="mt-3 text-dense text-paper-300">
              Today a diagnosis runs live and is returned to you; it is not yet stored
              against your account. Investigation history, saved evidence, and sharing
              arrive in Milestone 3.
            </p>
            <ul className="mt-6 space-y-3 text-dense text-paper-300">
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
              className="mt-auto pt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-400 transition hover:text-amber-300"
            >
              Open Kubernetes diagnosis →
            </Link>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
