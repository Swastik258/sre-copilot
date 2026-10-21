import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — SRE Copilot",
  description:
    "No analytics, no tracking, and local handling of keys and investigation data.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Privacy</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        No analytics. No tracking. Keys stay local.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        This page describes the reference implementation. It is deliberately
        short because the data practices are deliberately small.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <span className="label-caps">Analytics</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            None
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            The app does not ship an analytics SDK or a third-party tracking
            script.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Keys</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Backend only
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Integration secrets are read on the backend and are never returned
            to the browser bundle.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Investigation data</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Local by default
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Demo mode stays local. With privacy mode enabled, investigation
            content is not sent to an external AI provider.
          </p>
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        If you deploy this for a team, you are responsible for the privacy
        policy, retention rules, and data-processing agreements that apply to
        your environment.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/security" className="btn-accent">
          Read the security page
        </Link>
        <Link href="/support" className="btn-ghost">
          Ask a privacy question
        </Link>
      </div>
    </div>
  );
}
