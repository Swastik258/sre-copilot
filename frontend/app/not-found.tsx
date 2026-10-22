import type { Metadata } from "next";
import Link from "next/link";

import { MarketingFooter } from "@/components/MarketingFooter";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Page not found — SRE Copilot",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div data-theme="paper" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopNav />
      <main id="main-content" className="shell grid min-h-[70vh] place-items-center py-24">
        <div className="max-w-xl text-center">
          <span className="label-caps">404 / Not found</span>
          <h1 className="heading-display mt-5 text-4xl text-[var(--text)] sm:text-5xl">
            That route does not exist.
          </h1>
          <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">
            The page may have moved, or the link may be incomplete. The product,
            documentation, and security pages are still available.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-accent">Back to home</Link>
            <Link href="/product" className="btn-ghost">See the product</Link>
            <Link href="/docs" className="btn-ghost">Read the docs</Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
