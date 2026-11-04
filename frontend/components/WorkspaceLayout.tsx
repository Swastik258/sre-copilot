"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Bot,
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCode2,
  GitBranch,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings2,
  X,
  type LucideIcon,
} from "lucide-react";
import { FEATURES, DEFAULT_PLAN, featureForPath, hasFeatureAccess, type FeatureAccess } from "@/lib/feature-access";
import type { FeatureId } from "@/lib/feature-access";
import { useAuth } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeControls";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const EXTRA_ROUTES = [
  { label: "AI Assistant", href: "/assistant", status: "live", icon: Bot },
  { label: "Metrics", href: "/metrics", status: "live", icon: Activity },
  { label: "Runbooks", href: "/runbooks", status: "live", icon: BookOpen },
  { label: "Audit Log", href: "/audit", status: "live", icon: ClipboardList },
  { label: "Infrastructure Proposals", href: "/infra-code", status: "live", icon: FileCode2 },
] as const;

const FEATURE_ICONS: Record<FeatureId, LucideIcon> = {
  overview: LayoutDashboard,
  kubernetes: Boxes,
  logs: Activity,
  terraform: FileCode2,
  cicd: GitBranch,
  history: History,
  settings: Settings2,
};

const WORKSPACE_ROUTES = [
  { label: "Integrations", href: "/settings#integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings2 },
] as const;

const COMMANDS = [
  ...FEATURES.map(({ label, href, status }) => ({ label, href, status })),
  ...EXTRA_ROUTES,
  { label: "Integrations", href: "/settings#integrations", status: "live" },
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
  const [activeHash, setActiveHash] = useState("");
  const profileRef = useRef<HTMLDetailsElement>(null);
  const routeFeature = featureForPath(pathname);
  const routeAllowed = !routeFeature || hasFeatureAccess(DEFAULT_PLAN, routeFeature.id);
  const currentLabel = routeFeature?.label
    ?? EXTRA_ROUTES.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))?.label
    ?? (pathname === "/admin/settings" ? "Admin settings" : "Overview");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        if (profileRef.current) profileRef.current.open = false;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function closeProfileOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        if (profileRef.current) profileRef.current.open = false;
      }
    }

    document.addEventListener("pointerdown", closeProfileOnOutside);
    return () => document.removeEventListener("pointerdown", closeProfileOnOutside);
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

  const renderFeatureLink = (feature: FeatureAccess) => {
    const allowed = hasFeatureAccess(DEFAULT_PLAN, feature.id);
    const active = feature.id === "overview"
      ? pathname === "/dashboard"
      : feature.id === "settings"
        ? pathname === "/settings" && activeHash !== "#integrations"
        : feature.id === "history"
          ? pathname === feature.href || pathname.startsWith(`${feature.href}/`)
          : pathname === feature.href || pathname.startsWith(`${feature.href}/`);
    const href = allowed ? feature.href : `/dashboard/upgrade?feature=${feature.id}`;
    const NavIcon = FEATURE_ICONS[feature.id];

    return (
      <Link
        key={feature.id}
        href={href}
        title={collapsed ? feature.label : undefined}
        aria-current={active ? "page" : undefined}
        className={`workspace-nav-link ${active ? "is-active" : ""}`}
      >
        <span className="workspace-nav-icon"><NavIcon aria-hidden="true" /></span>
        <span className={`workspace-nav-text ${collapsed ? "lg:hidden" : ""}`}>{feature.label}</span>
        {!collapsed && <span className={`workspace-status ${feature.status}`} aria-label={feature.status}>
          <span className={`dot ${feature.status === "live" ? "dot-good" : "dot-idle"}`} />
        </span>}
        {!allowed && <span className={`workspace-upgrade-label ${collapsed ? "lg:hidden" : ""}`}>Upgrade</span>}
      </Link>
    );
  };

  const sidebar = (
    <aside className={`workspace-rail ${collapsed ? "is-collapsed" : ""} ${collapsed ? "lg:w-[76px]" : "lg:w-[264px]"}`}>
      <div className="workspace-rail-header">
        <Link href="/" className="workspace-brand" aria-label="Tarn home">
          <span className="workspace-brand-symbol" aria-hidden="true">T</span>
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
        <button type="button" onClick={() => setDrawerOpen(false)} className="workspace-drawer-close lg:hidden" aria-label="Close navigation"><X aria-hidden="true" /></button>
      </div>
      <nav aria-label="Workspace navigation" className="workspace-nav">
        <div className="workspace-nav-group">
          <p className={`workspace-nav-label ${collapsed ? "lg:hidden" : ""}`}>Operations</p>
          {FEATURES.filter((feature) => feature.id !== "settings").map(renderFeatureLink)}
        </div>
        <div className="workspace-nav-group">
          <p className={`workspace-nav-label ${collapsed ? "lg:hidden" : ""}`}>Intelligence</p>
          {EXTRA_ROUTES.map((route) => {
            const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
            const NavIcon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                title={collapsed ? route.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`workspace-nav-link ${active ? "is-active" : ""}`}
              >
                <span className="workspace-nav-icon"><NavIcon aria-hidden="true" /></span>
                <span className={`workspace-nav-text ${collapsed ? "lg:hidden" : ""}`}>{route.label}</span>
                {!collapsed && <span className="workspace-status live" aria-label="Live"><span className="dot dot-good" /></span>}
              </Link>
            );
          })}
        </div>
        <div className="workspace-nav-group">
          <p className={`workspace-nav-label ${collapsed ? "lg:hidden" : ""}`}>Workspace</p>
          {WORKSPACE_ROUTES.map((route) => {
            const active = route.label === "Integrations"
              ? pathname === "/settings" && activeHash === "#integrations"
              : pathname === "/settings" && activeHash !== "#integrations";
            const NavIcon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                title={collapsed ? route.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`workspace-nav-link ${active ? "is-active" : ""}`}
              >
                <span className="workspace-nav-icon"><NavIcon aria-hidden="true" /></span>
                <span className={`workspace-nav-text ${collapsed ? "lg:hidden" : ""}`}>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <Link href="/" className={`workspace-site-link ${collapsed ? "is-collapsed" : ""}`} title={collapsed ? "Back to website" : undefined}>
        <ArrowUpRight aria-hidden="true" />
        <span className={collapsed ? "lg:hidden" : ""}>Back to website</span>
      </Link>
    </aside>
  );

  return (
    <div className={`workspace-shell workspace-premium ${pathname === "/dashboard" ? "dashboard-workspace" : ""}`}>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="workspace-drawer-backdrop absolute inset-0" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
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
      <div className={`workspace-content min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
        <header className="workspace-header sticky top-0 z-20">
          <div className="workspace-header-inner">
            <div className="workspace-header-leading">
              <button type="button" onClick={() => setCollapsed(!collapsed)} className="workspace-sidebar-toggle hidden lg:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
                {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => setDrawerOpen(true)} className="workspace-menu-button lg:hidden" aria-label="Open navigation" aria-expanded={drawerOpen}>
                <Menu aria-hidden="true" />
              </button>
              <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
                <span>Workspace</span>
                <ChevronRight aria-hidden="true" />
                <strong>{currentLabel}</strong>
              </nav>
            </div>
            <div className="workspace-header-actions">
              <WorkspaceSwitcher />
              <button type="button" className="workspace-command-button" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
                <Search aria-hidden="true" />
                <span>Search</span><kbd>Ctrl K</kbd>
              </button>
              <ThemeToggle />
              <details className="workspace-profile" ref={profileRef}>
                <summary aria-label="Open user profile menu">
                  <span className="workspace-profile-avatar">{initials(user.display_name, user.email)}</span>
                  <span className="workspace-profile-copy">
                    <strong>{user.display_name?.trim() || user.email || "Tarn user"}</strong>
                    <small>{user.role}</small>
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <div className="workspace-profile-menu">
                  <div className="workspace-profile-details">
                    <span>Signed in as</span>
                    <strong>{user.email || "Email unavailable"}</strong>
                    <small>{user.role}</small>
                  </div>
                  <Link href="/settings">
                    <Settings2 aria-hidden="true" />
                    Account settings
                  </Link>
                  <button type="button" onClick={() => void signOut()}>
                    <LogOut aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </details>
          </div>
          </div>
        </header>
        <main id="main-content" className="workspace-main mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
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
