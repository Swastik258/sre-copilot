import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Testimonials — SRE Copilot",
  description:
    "No invented testimonials. Named feedback will appear only with permission.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Customers / Testimonials</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Quotes we can attribute, or none at all.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        We do not invent testimonials. When partners are willing to be quoted —
        by name and role — their words will appear here. For now, this page is
        an honest empty state.
      </p>

      <div className="card mt-12 p-8">
        <span className="label-caps">Status</span>
        <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
          No published testimonials yet
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Feedback is collected against specific questions: did the evidence
          match reality, what was missing, and would you page with it? A quote
          will only be published with the person&apos;s name and role.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/customers" className="btn-ghost">
            Back to customers
          </Link>
          <Link href="/support" className="btn-accent">
            Share feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
