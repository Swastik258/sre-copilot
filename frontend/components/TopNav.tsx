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
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setOpenIndex(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#101113]/95 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Left: logo + primary links */}
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-paper-50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-signal-good border-t-transparent" />
            </span>
            <span className="tracking-tight">SRE Copilot</span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
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
                    className={`inline-flex items-center gap-1 py-2 text-sm font-medium transition-colors ${
                      active || isOpen
                        ? "text-paper-50"
                        : "text-paper-300 hover:text-paper-50"
                    }`}
                    aria-haspopup={hasChildren || undefined}
                    aria-expanded={hasChildren ? isOpen : undefined}
                  >
                    {item.label}
                    {hasChildren && (
                      <svg
                        viewBox="0 0 12 12"
                        className={`h-2.5 w-2.5 opacity-40 transition-transform ${
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
                    <div className="absolute left-0 top-full z-50 pt-2">
                      <div className="min-w-[280px] rounded-md border border-hairline-strong bg-ink-850 p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenIndex(null)}
                            className="block rounded px-3 py-2.5 transition hover:bg-ink-800"
                          >
                            <div className="text-[13px] font-medium text-paper-100">
                              {child.label}
                            </div>
                            {child.description && (
                              <div className="mt-0.5 text-xs text-paper-400">
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

        <Show when="signed-out">
          <div className="flex shrink-0 items-center gap-2">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-medium text-paper-200 transition hover:text-paper-50"
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-400"
              >
                Sign up
              </button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}