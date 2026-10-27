"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";

const LINKS = [
  { label: "Product", href: "/product" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  async function handleSignOut() {
    setMobileOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  const primaryHref = user ? "/dashboard" : "/sign-up";

  return (
    <header className={`site-nav${scrolled ? " is-scrolled" : ""}`}>
      <nav className="shell site-nav-inner" aria-label="Main navigation">
        <Link href="/" className="site-brand" aria-label="Tarn home">
          <Image
            src="/tarn-wordmark-ink.svg"
            alt="Tarn"
            width={118}
            height={36}
            priority
          />
        </Link>

        <div className="site-nav-links">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="site-nav-actions">
          {user ? (
            <button type="button" className="site-nav-text-button" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link className="site-nav-signin" href="/login">
              Sign in
            </Link>
          )}
          <Link className="btn-accent site-nav-cta" href={primaryHref}>
            {user ? "Dashboard" : "Get started"}
          </Link>
        </div>

        <button
          type="button"
          className="site-nav-menu-button"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            {mobileOpen ? (
              <path d="m5 5 10 10M15 5 5 15" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" />
            )}
          </svg>
        </button>
      </nav>

      <div
        id="mobile-navigation"
        className={`site-nav-sheet${mobileOpen ? " is-open" : ""}`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <nav className="site-nav-sheet-links" aria-label="Mobile navigation">
          {LINKS.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
          {user ? (
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              Sign in
            </Link>
          )}
          <Link
            href={primaryHref}
            className="btn-accent"
            onClick={() => setMobileOpen(false)}
          >
            {user ? "Dashboard" : "Get started"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
