"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

export function TopNav() {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

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
                      <div className="min-w-[280px] border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenIndex(null)}
                            className="block px-3 py-2.5 transition-colors hover:bg-[var(--bg-subtle)]"
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

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            Sign in
          </Link>
          <Link href="/assistant" className="btn-accent">
            Start investigation
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
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-[var(--bg)] lg:hidden"
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
              <Link
                href="/assistant"
                onClick={() => setMobileOpen(false)}
                className="btn-accent w-full"
              >
                Start investigation
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-ghost w-full"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
