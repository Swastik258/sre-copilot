import type { Metadata } from "next";
import Link from "next/link";

import { ContourField } from "@/components/ContourField";
import { MarketingFooter } from "@/components/MarketingFooter";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Page not found — Tarn",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div data-theme="paper" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopNav />
      <main id="main-content" className="site-main">
        <section className="not-found-page">
          <ContourField className="not-found-page__contour" rings={8} />
          <div className="shell not-found-page__inner">
            <p className="section-label">404 / Not found</p>
            <h1>That route does not exist.</h1>
            <p>
              The page may have moved, or the link may be incomplete. The
              product, documentation, and security pages are still available.
            </p>
            <div className="page-actions">
              <Link href="/" className="btn-primary">
                Back to home
              </Link>
              <Link href="/product" className="btn-ghost">
                See the product
              </Link>
              <Link href="/docs" className="btn-ghost">
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
