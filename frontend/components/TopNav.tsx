"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-client";

type NavChild = { label: string; href: string; description?: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

const LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Product",
    href: "/product",
    children: [
      {
        label: "AI Assistant",
        href: "/assistant",
        description: "Investigate with evidence",
      },
      {
        label: "Kubernetes",
        href: "/kubernetes",
        description: "Read-only cluster diagnostics",
      },
      {
        label: "Logs",
        href: "/logs",
        description: "Group, dedupe, first occurrence",
      },
      {
        label: "CI/CD",
        href: "/cicd",
        description: "GitHub Actions failure analysis",
      },
      {
        label: "Terraform",
        href: "/terraform",
        description: "Plan explainer and risk",
      },
      {
        label: "Infrastructure Code",
        href: "/infra-code",
        description: "Generate and validate",
      },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      {
        label: "Platform teams",
        href: "/solutions/platform",
        description: "Standardize diagnosis",
      },
      {
        label: "SRE on-call",
        href: "/solutions/sre",
        description: "Faster incident triage",
      },
      {
        label: "DevOps",
        href: "/solutions/devops",
        description: "Pipeline and infra review",
      },
    ],
  },
  {
    label: "Customers",
    href: "/customers",
    children: [
      {
        label: "Case studies",
        href: "/customers/case-studies",
        description: "How teams use it",
      },
      {
        label: "Testimonials",
        href: "/customers/testimonials",
        description: "What engineers say",
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Docs", href: "/docs", description: "Guides and reference" },
      { label: "Blog", href: "/blog", description: "Engineering notes" },
      { label: "Changelog", href: "/changelog", description: "What shipped" },
      { label: "Support", href: "/support", description: "Get help" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "SC";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SC"
  );
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  async function handleSignOut() {
    setOpenIndex(null);
    setMobileOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
        setMobileOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenIndex(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setOpenIndex(null);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]"
    >
      <nav className="shell flex h-16 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex shrink-0 items-center gap-3 text-sm font-semibold text-[var(--text)]"
          >
            <span className="grid size-8 place-items-center border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-[var(--accent)]">
              SC
            </span>
            <span>SRE Copilot</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((item, index) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              const hasChildren = Boolean(item.children?.length);
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    if (hasChildren) setOpenIndex(index);
                  }}
                  onMouseLeave={() => {
                    if (hasChildren) setOpenIndex(null);
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={(event) => {
                      if (hasChildren) {
                        event.preventDefault();
                        setOpenIndex(isOpen ? null : index);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                      active || isOpen
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                    aria-haspopup={hasChildren || undefined}
                    aria-expanded={hasChildren ? isOpen : undefined}
                  >
                    {item.label}
                    {hasChildren && (
                      <svg
                        viewBox="0 0 12 12"
                        className={`h-2.5 w-2.5 opacity-60 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      >
                        <path
                          d="M2 4l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </Link>

                  {hasChildren && isOpen && (
                    <div className="absolute left-0 top-full z-50 pt-3">
                      <div className="dropdown-panel min-w-[280px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-2">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenIndex(null)}
                            className="nav-dropdown-link block px-3 py-2.5 hover:bg-[var(--bg-subtle)]"
                          >
                            <div className="text-sm font-medium text-[var(--text)]">
                              {child.label}
                            </div>
                            {child.description && (
                              <div className="mt-1 text-xs text-[var(--text-muted)]">
                                {child.description}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {loading ? (
            <span className="loading-line h-3 w-20 rounded-[2px]" aria-hidden />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                aria-label="Open your dashboard"
              >
                <span className="grid size-7 place-items-center border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-[10px] font-semibold text-[var(--accent)]">
                  {initials(user.display_name, user.email)}
                </span>
                <span className="max-w-[8rem] truncate">
                  {user.display_name?.trim() || user.email || "Dashboard"}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              Sign in
            </Link>
          )}
          <Link href={user ? "/dashboard" : "/assistant"} className="btn-accent">
            {user ? "Open console" : "Start investigation"}
          </Link>
        </div>

        <button
          type="button"
          className="grid size-9 place-items-center border border-[var(--border-strong)] text-[var(--text)] lg:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((isOpen) => !isOpen)}
        >
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="mobile-panel max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-[var(--bg)] lg:hidden"
        >
          <div className="shell py-6">
            <div className="grid gap-6">
              {LINKS.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`inline-block text-sm font-semibold ${
                      pathname === item.href
                        ? "text-[var(--accent)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="mt-2 grid gap-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-5">
              {user ? (
                <>
                  <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                    <span className="grid size-9 place-items-center border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-[var(--accent)]">
                      {initials(user.display_name, user.email)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--text)]">
                        {user.display_name?.trim() || user.email || "Signed in"}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                        read-only session
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="btn-accent w-full"
                  >
                    Open console
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn-ghost w-full"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  {loading ? (
                    <span className="loading-line h-9 w-full" aria-hidden />
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-ghost w-full"
                    >
                      Sign in
                    </Link>
                  )}
                  <Link
                    href="/assistant"
                    onClick={() => setMobileOpen(false)}
                    className="btn-accent w-full"
                  >
                    Start investigation
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
