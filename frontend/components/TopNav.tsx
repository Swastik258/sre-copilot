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
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        ref={navRef}
        className="flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/60 px-2 py-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/40"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-[11px] font-bold text-white">
            SC
          </span>
          <span className="hidden sm:inline">SRE Copilot</span>
        </Link>

        <div className="hidden items-center md:flex">
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
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${
                    active || isOpen
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
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
                  <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                    <div className="min-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpenIndex(null)}
                          className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
                        >
                          <div className="text-xs font-medium text-white">
                            {child.label}
                          </div>
                          {child.description && (
                            <div className="mt-0.5 text-[11px] text-white/50">
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

        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            className="hidden rounded-full px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/assistant"
            className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black transition hover:bg-white/90"
          >
            Open console
          </Link>
        </div>
      </nav>
    </header>
  );
}