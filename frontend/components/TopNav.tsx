"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-client";

type NavChild = { label: string; href: string; description?: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

const LINKS: NavItem[] = [
  { label: "Demo", href: "/demo" },
  {
    label: "Product",
    href: "/product",
    children: [
      {
        label: "Kubernetes",
        href: "/product/kubernetes",
        description: "Pod status, events, previous logs",
      },
      {
        label: "Logs",
        href: "/product/logs",
        description: "Group, dedupe, first occurrence",
      },
      {
        label: "CI/CD",
        href: "/product/cicd",
        description: "GitHub Actions failure analysis",
      },
      {
        label: "Terraform",
        href: "/product/terraform",
        description: "Plan explainer and risk",
      },
      {
        label: "Metrics",
        href: "/product/metrics",
        description: "Prometheus queries and correlation",
      },
      {
        label: "Runbooks",
        href: "/product/runbooks",
        description: "Operator triage sequences",
      },
      {
        label: "Assistant",
        href: "/product/assistant",
        description: "Answers attached to evidence",
      },
      {
        label: "Infrastructure code",
        href: "/product/infra-code",
        description: "Proposal-only generation",
      },
      {
        label: "Audit",
        href: "/product/audit",
        description: "Decisions and retained outcomes",
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
        description: "One evidence contract",
      },
      {
        label: "SRE on-call",
        href: "/solutions/sre",
        description: "Facts before the third tab",
      },
      {
        label: "DevOps",
        href: "/solutions/devops",
        description: "Pipeline and plan review",
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Docs", href: "/docs", description: "Reference and setup" },
      { label: "Security", href: "/security", description: "Controls and gaps" },
      { label: "Changelog", href: "/changelog", description: "What changed" },
      { label: "Support", href: "/support", description: "Ask a specific question" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "T";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "T"
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
    <>
      {openIndex !== null && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpenIndex(null)}
        />
      )}
      <header ref={navRef} className="site-nav">
        <nav className="site-nav__inner shell" aria-label="Primary">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="site-brand"
            aria-label="Tarn home"
          >
            <Image
              className="wordmark-paper"
              src="/tarn-wordmark.svg"
              alt="Tarn"
              width={124}
              height={37}
              priority
            />
            <Image
              className="wordmark-ink"
              src="/tarn-wordmark-ink.svg"
              alt=""
              aria-hidden
              width={124}
              height={37}
              priority
            />
          </Link>

          <div className="site-nav__links">
            {LINKS.map((item, index) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const hasChildren = Boolean(item.children?.length);
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.href}
                  className="site-nav__item"
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
                    className={`site-nav__link ${active || isOpen ? "is-active" : ""}`}
                    aria-haspopup={hasChildren || undefined}
                    aria-expanded={hasChildren ? isOpen : undefined}
                    aria-current={active && !hasChildren ? "page" : undefined}
                  >
                    {item.label}
                    {hasChildren ? (
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path
                          d="M2 4.25 6 8.25l4-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : null}
                  </Link>

                  {hasChildren && isOpen ? (
                    <div className="nav-menu">
                      <div className="nav-menu__panel">
                        <p className="nav-menu__title">{item.label}</p>
                        <div className="nav-menu__links">
                          {item.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpenIndex(null)}
                              className="nav-menu__link"
                            >
                              <span>{child.label}</span>
                              {child.description ? (
                                <small>{child.description}</small>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="site-nav__actions">
            {loading ? (
              <span className="loading-line h-3 w-20" aria-hidden />
            ) : user ? (
              <>
                <Link href="/dashboard" className="site-nav__account">
                  <span className="site-nav__initials">
                    {initials(user.display_name, user.email)}
                  </span>
                  <span>
                    {user.display_name?.trim() || user.email || "Dashboard"}
                  </span>
                </Link>
                <button type="button" onClick={handleSignOut} className="site-nav__text-button">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="site-nav__text-button">
                Sign in
              </Link>
            )}
            <Link href={user ? "/dashboard" : "/demo"} className="btn-primary btn-small">
              {user ? "Open console" : "Try the demo"}
            </Link>
          </div>

          <button
            type="button"
            className="site-nav__toggle"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((isOpen) => !isOpen)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {mobileOpen ? (
                <path
                  d="m5 5 10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </nav>

        {mobileOpen ? (
          <div id="mobile-navigation" className="mobile-panel">
            <div className="shell mobile-panel__inner">
              <div className="mobile-panel__groups">
                {LINKS.map((item) => (
                  <div key={item.href} className="mobile-panel__group">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`mobile-panel__parent ${
                        pathname === item.href ? "is-active" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                    {item.children ? (
                      <div className="mobile-panel__children">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="mobile-panel__child"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mobile-panel__actions">
                {user ? (
                  <>
                    <div className="mobile-panel__account">
                      <span className="site-nav__initials">
                        {initials(user.display_name, user.email)}
                      </span>
                      <div>
                        <span>{user.display_name?.trim() || user.email || "Signed in"}</span>
                        <small>Read-only session</small>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary"
                    >
                      Open console
                    </Link>
                    <button type="button" onClick={handleSignOut} className="btn-ghost">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-ghost"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/demo"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary"
                    >
                      Try the demo
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
