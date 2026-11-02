"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "#pricing" },
] as const;

export function LandingNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const reduceMotion = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryHref = user ? "/dashboard" : "/sign-up";
  const primaryLabel = user ? "Dashboard" : "Get started";

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 12);
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const navLinks = (
    <>
      {LINKS.map(({ label, href }) => (
        <Link
          key={label}
          className="landing-nav-link"
          href={href}
          onClick={() => setMenuOpen(false)}
        >
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <header className={cn("landing-nav", scrolled && "is-scrolled")}>
      <nav className="landing-nav-inner" aria-label="Main navigation">
        <Link href="/" className="landing-brand" aria-label="Tarn home">
          <Image
            src="/tarn-wordmark-ink.svg"
            alt="Tarn"
            width={110}
            height={33}
            priority
          />
        </Link>

        <div className="landing-nav-links">{navLinks}</div>

        <div className="landing-nav-actions">
          <Link className="landing-login" href={user ? "/dashboard" : "/login"}>
            {user ? "Workspace" : "Log in"}
          </Link>
          <Link className="landing-nav-cta" href={primaryHref}>
            {primaryLabel}
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
          </Link>
        </div>

        <button
          type="button"
          className="landing-menu-button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id="landing-mobile-menu"
            className="landing-mobile-menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: "easeOut" }}
          >
            <div className="landing-mobile-links">{navLinks}</div>
            <div className="landing-mobile-actions">
              <Link
                className="landing-login"
                href={user ? "/dashboard" : "/login"}
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Workspace" : "Log in"}
              </Link>
              <Link
                className="landing-nav-cta"
                href={primaryHref}
                onClick={() => setMenuOpen(false)}
              >
                {primaryLabel}
                <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
