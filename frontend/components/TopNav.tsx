"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { clerkEnabled } from "@/lib/auth";

type NavChild = { label: string; href: string; description?: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

const LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Product",
    href: "/product",
    children: [
      { label: "AI Assistant", href: "/assistant", description: "Investigate with evidence" },
      { label: "Kubernetes", href: "/kubernetes", description: "Read-only cluster diagnostics" },
      { label: "Logs", href: "/logs", description: "Group, dedupe, first occurrence" },
      { label: "CI/CD", href: "/cicd", description: "GitHub Actions failure analysis" },
      { label: "Terraform", href: "/terraform", description: "Plan explainer and risk" },
      { label: "Infrastructure Code", href: "/infra-code", description: "Generate and validate" },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      { label: "Platform teams", href: "/solutions/platform", description: "Standardize diagnosis" },
      { label: "SRE on-call", href: "/solutions/sre", description: "Faster incident triage" },
      { label: "DevOps", href: "/solutions/devops", description: "Pipeline and infra review" },
    ],
  },
  {
    label: "Customers",
    href: "/customers",
    children: [
      { label: "Case studies", href: "/customers/case-studies", description: "How teams use it" },
      { label: "Testimonials", href: "/customers/testimonials", description: "What engineers say" },
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
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
        setMobileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
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
    setMobileOpen(false);
    setOpenIndex(null);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the home hero the pill is a touch more transparent; once scrolled or
  // on any other route it firms up into a frosted dark pill.
  const overHero = pathname === "/" && !scrolled && !mobileOpen;

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3"
    >
      <nav className="mx-auto w-full max-w-[80rem]">
        <div
          className={`flex h-14 items-center justify-between gap-3 rounded-full border px-2.5 pl-4 backdrop-blur-xl transition-colors duration-200 ${
            overHero
              ? "border-white/10 bg-black/40"
              : "border-white/10 bg-black/75 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.95)]"
          }`}
        >
          {/* Left */}
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex shrink-0 items-center gap-3 text-base font-semibold text-paper-50"
            >
              <span className="grid size-8 place-items-center rounded-lg border border-hairline-strong bg-ink-800 font-mono text-xs font-semibold text-amber-400">
                SC
              </span>
              <span className="tracking-[-0.02em]">SRE Copilot</span>
            </Link>

            <div className="hidden items-center gap-0.5 lg:flex">
              {LINKS.map((item, i) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const hasChildren = !!item.children?.length;
                const isOpen = openIndex === i;

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => hasChildren && setOpenIndex(i)}
                    onMouseLeave={() => hasChildren && setOpenIndex(null)}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          setOpenIndex(isOpen ? null : i);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        active || isOpen
                          ? "text-amber-400"
                          : "text-paper-300 hover:text-paper-50"
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
                        <div className="min-w-[280px] rounded-2xl border border-white/10 bg-[#101014]/95 p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpenIndex(null)}
                              className="block rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                            >
                              <div className="text-sm font-medium text-paper-100">
                                {child.label}
                              </div>
                              {child.description && (
                                <div className="mt-1 text-xs text-paper-400">
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

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2">
            {clerkEnabled ? (
              <>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="hidden rounded-full px-3 py-2 text-sm font-medium text-paper-300 transition hover:text-paper-50 sm:inline-block"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button type="button" className="btn-accent !px-4 !py-2 !text-sm">
                      Open console
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </>
            ) : (
              <Link href="/assistant" className="btn-accent !px-4 !py-2 !text-sm">
                Open console
              </Link>
            )}

            <button
              type="button"
              className="grid size-9 place-items-center rounded-full border border-hairline-strong text-paper-100 transition hover:bg-white/5 lg:hidden"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((isOpen) => !isOpen)}
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                {mobileOpen ? (
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            id="mobile-navigation"
            className="mt-3 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#101014]/95 p-5 backdrop-blur-xl lg:hidden"
          >
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {LINKS.map((item) => (
                <div key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`inline-block py-1 text-sm font-semibold transition ${
                      pathname === item.href ? "text-amber-400" : "text-paper-200 hover:text-paper-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="truncate py-2 text-sm text-paper-400 transition hover:text-paper-100"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
