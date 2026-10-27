"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FEATURES, DEFAULT_PLAN, PLANS, featureForPath, hasFeatureAccess } from "@/lib/feature-access";
import { useAuth } from "@/lib/auth-client";

const EXTRA_ROUTES = [
  { label: "AI assistant", href: "/assistant", status: "live" },
  { label: "Metrics", href: "/metrics", status: "live" },
  { label: "Runbooks", href: "/runbooks", status: "live" },
  { label: "Audit log", href: "/audit", status: "live" },
  { label: "Infrastructure proposals", href: "/infra-code", status: "live" },
] as const;

const COMMANDS = [
  ...FEATURES.map(({ label, href, status }) => ({ label, href, status })),
  ...EXTRA_ROUTES,
];

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "Tarn";
  return source.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "").join("") || "T";
}

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const routeFeature = featureForPath(pathname);
  const routeAllowed = !routeFeature || hasFeatureAccess(DEFAULT_PLAN, routeFeature.id);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") setCommandOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function signOut() {
    await logout();
    router.replace("/");
  }

  if (loading || !user) {
    return (
      <main id="main-content" className="workspace-shell grid min-h-screen place-items-center">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-[var(--text-muted)]">
          {loading ? "Loading workspace…" : "Redirecting to sign in…"}
        </p>
      </main>
    );
  }

  const sidebar = (
    <aside className={`workspace-rail ${collapsed ? "is-collapsed" : ""} ${collapsed ? "lg:w-[76px]" : "lg:w-[264px]"}`}>
      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
        <Link href="/" className="workspace-brand" aria-label="Tarn home">
          <Image
            className="wordmark-paper"
            src="/tarn-wordmark.svg"
            alt=""
            width={118}
            height={36}
          />
          <Image
            className="wordmark-ink"
            src="/tarn-wordmark-ink.svg"
            alt=""
            width={118}
            height={36}
          />
        </Link>
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="hidden rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] lg:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? "»" : "«"}
        </button>
        <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm text-[var(--text-muted)] lg:hidden" aria-label="Close navigation">Close</button>
      </div>
      <nav aria-label="Workspace navigation" className="workspace-nav flex-1 space-y-1 overflow-y-auto p-3">
        <p className={`workspace-nav-label ${collapsed ? "lg:hidden" : ""}`}>Operations</p>
        {FEATURES.map((feature) => {
          const allowed = hasFeatureAccess(DEFAULT_PLAN, feature.id);
          const active = feature.id === "overview"
            ? pathname === "/dashboard"
            : feature.id === "settings"
              ? pathname === "/settings"
              : pathname === feature.href;
          const href = allowed ? feature.href : `/dashboard/upgrade?feature=${feature.id}`;
          return (
            <Link
              key={feature.id}
              href={href}
              title={collapsed ? feature.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`workspace-nav-link ${active ? "is-active" : ""}`}
            >
              <span aria-hidden className="w-5 shrink-0 text-center font-mono text-xs">{allowed ? "◇" : "·"}</span>
              <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>{feature.label}</span>
              <span className={`workspace-status ${feature.status} ${collapsed ? "lg:hidden" : ""}`}>
                <span className={`dot ${feature.status === "live" ? "dot-good" : "dot-idle"}`} />
                {feature.status}
              </span>
              {!allowed && <span className={`text-[10px] text-[var(--accent)] ${collapsed ? "lg:hidden" : ""}`}>Upgrade</span>}
            </Link>
          );
        })}
        <p className={`workspace-nav-label mt-4 ${collapsed ? "lg:hidden" : ""}`}>Signals &amp; tools</p>
        {EXTRA_ROUTES.map((route) => {
          const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
          return (
            <Link
              key={route.href}
              href={route.href}
              title={collapsed ? route.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`workspace-nav-link ${active ? "is-active" : ""}`}
            >
              <span aria-hidden className="w-5 shrink-0 text-center font-mono text-xs">◇</span>
              <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>{route.label}</span>
              <span className={`workspace-status live ${collapsed ? "lg:hidden" : ""}`}>
                <span className="dot dot-good" />
                Live
              </span>
            </Link>
          );
        })}
      </nav>
      <Link href="/" className={`border-t border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)] ${collapsed ? "text-center" : ""}`}>
        {collapsed ? "←" : "← Back to website"}
      </Link>
    </aside>
  );

  return (
    <div className={`workspace-shell ${pathname === "/dashboard" ? "dashboard-workspace" : ""}`}>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-[min(86vw,300px)]">{sidebar}</div>
        </div>
      )}
      {commandOpen && (
        <div
          className="workspace-command-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCommandOpen(false);
          }}
        >
          <section className="workspace-command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title">
            <h2 id="command-title" className="sr-only">Workspace command palette</h2>
            <input
              autoFocus
              type="search"
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.currentTarget.value)}
              placeholder="Search workspace…"
              aria-label="Search workspace commands"
            />
            <ul className="space-y-1 p-2">
              {COMMANDS.filter((feature) => feature.label.toLowerCase().includes(commandQuery.toLowerCase())).map((feature) => (
                <li key={feature.href}>
                  <button
                    type="button"
                    className="workspace-command-option"
                    onClick={() => {
                      router.push(feature.href);
                      setCommandOpen(false);
                      setCommandQuery("");
                    }}
                  >
                    <span>{feature.label}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-subtle)]">{feature.status}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="border-t border-[var(--border)] px-4 py-2 font-mono text-[9px] text-[var(--text-subtle)]">
              Navigate with a command · ESC to close
            </p>
          </section>
        </div>
      )}
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
        <header className="workspace-header sticky top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(true)} className="rounded-md border border-[var(--border)] px-2 py-1 text-sm text-[var(--text-muted)] lg:hidden" aria-label="Open navigation">☰</button>
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">
              Workspace / {routeFeature?.label ?? EXTRA_ROUTES.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))?.label ?? "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="workspace-command-button" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
              <span>Search</span><kbd>⌘ K</kbd>
            </button>
            <span className="hidden border border-[var(--border)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-[9px] text-[var(--signal-good)] sm:inline-flex">{PLANS[DEFAULT_PLAN].name}</span>
            <span className="grid size-8 place-items-center rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--accent)]">{initials(user.display_name, user.email)}</span>
            <button type="button" onClick={() => void signOut()} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Sign out</button>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          {routeAllowed ? children : (
            <section className="mx-auto max-w-xl rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8">
              <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--accent)]">Plan access</p>
              <h1 className="mt-3 text-2xl font-semibold">This feature is not included in your plan</h1>
              <p className="mt-3 text-sm text-[var(--text-muted)]">Upgrade options will be available here when billing is introduced.</p>
              <Link href="/dashboard" className="mt-5 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Back to overview</Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
