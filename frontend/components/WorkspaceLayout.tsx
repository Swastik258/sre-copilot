"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FEATURES, DEFAULT_PLAN, PLANS, featureForPath, hasFeatureAccess } from "@/lib/feature-access";
import { useAuth } from "@/lib/auth-client";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "SRE Copilot";
  return source.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "").join("") || "SC";
}

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [plannedFeature, setPlannedFeature] = useState<string | null>(null);
  const routeFeature = featureForPath(pathname);
  const routeAllowed = !routeFeature || hasFeatureAccess(DEFAULT_PLAN, routeFeature.id);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    setPlannedFeature(new URLSearchParams(window.location.search).get("feature"));
  }, [pathname]);

  async function signOut() {
    await logout();
    router.replace("/");
  }

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070A]">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-[#9AA4B2]">
          {loading ? "Loading workspace…" : "Redirecting to sign in…"}
        </p>
      </main>
    );
  }

  const sidebar = (
    <aside className={`flex h-full w-[264px] flex-col border-r border-white/10 bg-[#090D12] transition-[width] duration-200 ${collapsed ? "lg:w-[76px]" : "lg:w-[264px]"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <span className={collapsed ? "font-semibold tracking-tight text-white lg:hidden" : "font-semibold tracking-tight text-white"}>SRE <span className="text-sky-400">Copilot</span></span>
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="hidden rounded-md border border-white/10 px-2 py-1 text-xs text-[#9AA4B2] hover:text-white lg:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? "»" : "«"}
        </button>
        <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm text-[#9AA4B2] lg:hidden" aria-label="Close navigation">Close</button>
      </div>
      <nav aria-label="Workspace navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {FEATURES.map((feature) => {
          const allowed = hasFeatureAccess(DEFAULT_PLAN, feature.id);
          const plannedActive = feature.status === "planned"
            && pathname === "/dashboard/coming-soon"
            && plannedFeature === feature.id;
          const active = plannedActive || (feature.id === "overview"
            ? pathname === "/dashboard"
            : feature.id === "settings"
              ? pathname === "/settings"
              : pathname === feature.href);
          const href = allowed ? feature.href : `/dashboard/upgrade?feature=${feature.id}`;
          return (
            <Link
              key={feature.id}
              href={href}
              title={collapsed ? feature.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? "bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20" : "text-[#9AA4B2] hover:bg-white/[.05] hover:text-white"}`}
            >
              <span aria-hidden className="w-5 shrink-0 text-center">{allowed ? "◇" : "Lock"}</span>
              <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>{feature.label}</span>
              {feature.status === "planned" && <span className={`rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#9AA4B2] ${collapsed ? "lg:hidden" : ""}`}>Planned</span>}
              {!allowed && <span className={`text-[10px] text-sky-300 ${collapsed ? "lg:hidden" : ""}`}>Upgrade</span>}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className={`border-t border-white/10 px-4 py-4 text-sm text-[#9AA4B2] hover:text-white ${collapsed ? "text-center" : ""}`}>
        {collapsed ? "←" : "← Back to website"}
      </Link>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#05070A] text-white">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-[min(86vw,300px)]">{sidebar}</div>
        </div>
      )}
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#05070A]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(true)} className="rounded-md border border-white/10 px-2 py-1 text-sm text-[#9AA4B2] lg:hidden" aria-label="Open navigation">☰</button>
            <span className="text-sm text-[#9AA4B2]">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-200 sm:inline-flex">{PLANS[DEFAULT_PLAN].name}</span>
            <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-[#0F1620] text-xs font-semibold text-sky-200">{initials(user.display_name, user.email)}</span>
            <button type="button" onClick={() => void signOut()} className="text-sm text-[#9AA4B2] hover:text-white">Sign out</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          {routeAllowed ? children : (
            <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0B0F14] p-8">
              <p className="font-mono text-[11px] uppercase tracking-[.16em] text-sky-300">Plan access</p>
              <h1 className="mt-3 text-2xl font-semibold">This feature is not included in your plan</h1>
              <p className="mt-3 text-sm text-[#9AA4B2]">Upgrade options will be available here when billing is introduced.</p>
              <Link href="/dashboard" className="mt-5 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm">Back to overview</Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
